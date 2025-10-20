import pandas as pd
import numpy as np
import joblib
import logging
import os
import warnings
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any, Optional
from pathlib import Path
import json

# ML Libraries
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import matplotlib.pyplot as plt


# Data processing
from scipy.spatial.distance import cosine
import re
from collections import defaultdict

warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('rto_pipeline.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class RTOPredictor:
    """
    Production-ready RTO (Return to Origin) Prediction Pipeline
    
    This class handles the complete ML pipeline for predicting whether 
    a shipment will be delivered or returned to origin.
    """
    
    def __init__(self, model_dir: str = "models"):
        """
        Initialize the RTO Predictor
        
        Args:
            model_dir: Directory to store model snapshots
        """
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(exist_ok=True)
        
        # Feature importance weights based on business requirements
        self.feature_weights = {
            'CLIENT_NAME': 0.1,      # Very Low
            'CUSTOMER_NAME': 0.2,    # Low
            'CUSTOMER_PHONE': 0.95,  # Very High
            'CUSTOMER_ADDRESS': 0.95,# Very High
            'CUSTOMER_CITY': 0.3,    # Low or based on history
            'CUSTOMER_STATE': 0.3,   # Low or based on history
            'PINCODE': 0.3,          # Low or based on history
            'PAYMENT_MODE': 0.8,     # High
            'COURIER_NAME': 0.8,     # High
            'ITEM_DESCRIPTION': 0.7, # High or based on history
            'WEIGHT': 0.2,           # Low
            'QTY': 0.2,              # Low
            'INVOICE_VALUE': 0.2,     # Low
            'ORDER_CREATION_DATE': 0.1, # Very Low
            'COLLECTABLE_AMOUNT': 0.1, # Very Low
            'EDD': 0.3,              # Very Low
            'ZONE':0.3,# Low or based on history
            # 'FIRST_ATTEMPT_REMARK':0.5, # High
            # 'SECOND_ATTEMPT_REMARK':0.5, # High
            # 'THIRD_ATTEMPT_REMARK':0.5, # High
            # 'UNDEL_REASON':0.8, # High
        }
        
        self.model = None
        self.label_encoders = {}
        self.scaler = None
        self.tfidf_vectorizer = None
        self.feature_columns = None
        self.historical_data = None
        
        # Performance tracking
        self.performance_metrics = {}
        self.courier_performance = defaultdict(dict)
        self.pincode_stats = defaultdict(dict)
        
        logger.info("RTO Predictor initialized")
    
    def preprocess_data(self, df: pd.DataFrame, is_training: bool = True) -> pd.DataFrame:
        df = df.copy()
        
        # 1. Handle missing values (enhanced)
        df = self._handle_missing_values(df)
        
        # 2. Create temporal features
        df = self._create_temporal_features(df)
        
        # 3. Create geographic features
        df = self._create_geographic_features(df)
        
        # 4. Feature engineering (existing)
        df = self._create_features(df)
        
        # 5. Create attempt pattern features
        df = self._create_attempt_features(df)
        
        # 6. Create customer behavior features
        df = self._create_customer_features(df)
        
        # 7. Clean and standardize text fields
        df = self._clean_text_fields(df)
        
        # 8. Enhanced phone processing
        df = self._process_phone_numbers(df)
        
        # 9. Enhanced address processing
        df = self._process_addresses(df)
        
        # 10. Create target variable
        if is_training and 'CURRENT_STATUS' in df.columns:
            df['RTO_TARGET'] = df['CURRENT_STATUS'].apply(self._create_target)
        
        # 11. Encode categorical variables
        df = self._encode_categorical(df, is_training)
        
        # 12. Handle outliers
        df = self._handle_outliers(df)
        
        # 13. Feature scaling (if needed)
        if hasattr(self, 'scaler'):
            df = self._scale_features(df)
        
        return df
    
    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in the dataset"""
        
        # Fill missing numerical values with median
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        for col in numerical_cols:
            df[col].fillna(df[col].median(), inplace=True)
        
        # Fill missing categorical values with mode or 'Unknown'
        categorical_cols = df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            if df[col].mode().empty:
                df[col].fillna('Unknown', inplace=True)
            else:
                df[col].fillna(df[col].mode()[0], inplace=True)
        
        return df
    
    def _create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create additional features for better prediction"""
        
        # Date features
        if 'ORDER_CREATION_DATE' in df.columns:
            df['ORDER_CREATION_DATE'] = pd.to_datetime(df['ORDER_CREATION_DATE'])
            df['ORDER_HOUR'] = df['ORDER_CREATION_DATE'].dt.hour
            df['ORDER_DAY_OF_WEEK'] = df['ORDER_CREATION_DATE'].dt.dayofweek
            df['ORDER_MONTH'] = df['ORDER_CREATION_DATE'].dt.month
        
        # Weight per quantity ratio
        if 'WEIGHT' in df.columns and 'QTY' in df.columns:
            df['WEIGHT_PER_ITEM'] = df['WEIGHT'] / df['QTY'].replace(0, 1)
        
        # Value per item
        if 'INVOICE_VALUE' in df.columns and 'QTY' in df.columns:
            df['VALUE_PER_ITEM'] = df['INVOICE_VALUE'] / df['QTY'].replace(0, 1)
        
        # High value order flag
        if 'INVOICE_VALUE' in df.columns:
            df['HIGH_VALUE_ORDER'] = (df['INVOICE_VALUE'] > df['INVOICE_VALUE'].quantile(0.75)).astype(int)
        
        # COD flag
        if 'PAYMENT_MODE' in df.columns:
            df['IS_COD'] = (df['PAYMENT_MODE'] == 'COD').astype(int)
        
        # Zone risk factor
        zone_risk = {'Within City': 1, 'Within Zone': 2, 'Rest Of India': 3, 'Special Zone': 4}
        if 'ZONE' in df.columns:
            df['ZONE_RISK'] = df['ZONE'].map(zone_risk).fillna(3)
        
        return df
    
    def _clean_text_fields(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and standardize text fields"""
        
        text_columns = ['CUSTOMER_NAME', 'CUSTOMER_ADDRESS', 'ITEM_DESCRIPTION']
        
        for col in text_columns:
            if col in df.columns:
                # Convert to string and clean
                df[col] = df[col].astype(str)
                df[col] = df[col].str.lower()
                df[col] = df[col].str.replace(r'[^\w\s]', ' ', regex=True)
                df[col] = df[col].str.replace(r'\s+', ' ', regex=True)
                df[col] = df[col].str.strip()
        
        return df
    
    def _process_phone_numbers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract features from phone numbers"""
        
        if 'CUSTOMER_PHONE' in df.columns:
            df['CUSTOMER_PHONE'] = df['CUSTOMER_PHONE'].astype(str)
            
            # Extract phone features
            df['PHONE_LENGTH'] = df['CUSTOMER_PHONE'].str.len()
            df['PHONE_STARTS_WITH'] = df['CUSTOMER_PHONE'].str[:2]
            
            # Check for valid phone patterns
            df['PHONE_VALID'] = df['CUSTOMER_PHONE'].str.match(r'^\d{10}$').astype(int)
            
            # Create phone hash for privacy (first 3 and last 2 digits)
            df['PHONE_PATTERN'] = df['CUSTOMER_PHONE'].str[:3] + 'XXX' + df['CUSTOMER_PHONE'].str[-2:]
        
        return df
    
    def _process_addresses(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract features from addresses"""
        
        if 'CUSTOMER_ADDRESS' in df.columns:
            # Address length
            df['ADDRESS_LENGTH'] = df['CUSTOMER_ADDRESS'].str.len()
            
            # Count of address components
            df['ADDRESS_WORD_COUNT'] = df['CUSTOMER_ADDRESS'].str.split().str.len()
            
            # Check for specific keywords that might indicate delivery difficulty
            risky_keywords = ['village', 'remote', 'interior', 'hills', 'tribal']
            df['ADDRESS_RISK_KEYWORDS'] = df['CUSTOMER_ADDRESS'].str.contains(
                '|'.join(risky_keywords), case=False, na=False
            ).astype(int)
        
        return df
    
    def _create_target(self, status: str) -> int:
        """Create binary target variable from status"""
        if pd.isna(status):
            return 0
        
        status = str(status).upper()
        # RTO cases
        if any(rto_keyword in status for rto_keyword in ['RTO', 'RETURN', 'UNDELIVERABLE', 'UNDELIVERED', 'RTO-INTRANSIT', 'RTO-DELIVERED', 'RTO-OFD']):
            return 1
        
        # Delivered cases
        if 'O-DELIVERED' in status and 'RTO' not in status:
            return 0
        
        # Default to non-RTO for ambiguous cases
        return 0
    
    def _encode_categorical(self, df: pd.DataFrame, is_training: bool) -> pd.DataFrame:
        """Encode categorical variables"""
        
        categorical_columns = [
            'CLIENT_NAME', 'COURIER_NAME', 'CUSTOMER_CITY', 
            'CUSTOMER_STATE', 'PAYMENT_MODE', 'ZONE'
        ]
        
        for col in categorical_columns:
            if col in df.columns:
                if is_training:
                    # Fit new encoder for training
                    self.label_encoders[col] = LabelEncoder()
                    df[f'{col}_ENCODED'] = self.label_encoders[col].fit_transform(df[col].astype(str))
                else:
                    # Use existing encoder for prediction
                    if col in self.label_encoders:
                        # Handle unseen categories
                        known_categories = set(self.label_encoders[col].classes_)
                        df[col] = df[col].astype(str)
                        df[col] = df[col].apply(lambda x: x if x in known_categories else 'Unknown')
                        
                        # Add 'Unknown' to encoder if not present
                        if 'Unknown' not in known_categories:
                            self.label_encoders[col].classes_ = np.append(
                                self.label_encoders[col].classes_, 'Unknown'
                            )
                        
                        df[f'{col}_ENCODED'] = self.label_encoders[col].transform(df[col])
                    else:
                        df[f'{col}_ENCODED'] = 0  # Default encoding for missing encoder
        
        return df
    
    def prepare_features(self, df: pd.DataFrame) -> np.ndarray:
        """Prepare feature matrix for ML model"""
        
        # Select relevant features based on importance
        feature_cols = [
            'CLIENT_NAME_ENCODED', 'COURIER_NAME_ENCODED', 'CUSTOMER_CITY_ENCODED',
            'CUSTOMER_STATE_ENCODED', 'PAYMENT_MODE_ENCODED', 'ZONE_ENCODED',
            'WEIGHT', 'QTY', 'INVOICE_VALUE', 'ZONE_RISK', 'IS_COD',
            'HIGH_VALUE_ORDER', 'WEIGHT_PER_ITEM', 'VALUE_PER_ITEM',
            'PHONE_LENGTH', 'PHONE_VALID', 'ADDRESS_LENGTH', 'ADDRESS_WORD_COUNT',
            'ADDRESS_RISK_KEYWORDS', 'ORDER_HOUR', 'ORDER_DAY_OF_WEEK', 'ORDER_MONTH'
        ]
        
        # Select only available columns
        available_cols = [col for col in feature_cols if col in df.columns]
        
        if not available_cols:
            raise ValueError("No valid feature columns found in the data")
        
        self.feature_columns = available_cols
        X = df[available_cols].copy()
        
        # Handle any remaining missing values
        X = X.fillna(0)
        
        return X.values
    def check_class_balance(self, df, target_col='RTO_TARGET'):
        value_counts = df[target_col].value_counts()
        total = value_counts.sum()
        print("📊 Class Distribution:")
        for cls, count in value_counts.items():
            pct = count / total * 100
            label = "RTO" if cls == 1 else "Delivered"
            print(f"  {label} ({cls}): {count} ({pct:.2f}%)")

        # Bar plot
        # import pdb;pdb.set_trace()
        # value_counts.plot(kind='bar', title="Class Distribution", color=['green', 'red'])
        # plt.xticks(ticks=[0, 1], labels=['Delivered (0)', 'RTO (1)'], rotation=0)
        # plt.ylabel("Count")
        # plt.tight_layout()
        # plt.show()

    def train_model(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Train the RTO prediction model
        
        Args:
            df: Training dataframe with historical data
            
        Returns:
            Training results and metrics
        """
        logger.info("Starting model training...")
        # Preprocess training data
        df_processed = self.preprocess_data(df, is_training=True)
        
        # Check if target exists
        if 'RTO_TARGET' not in df_processed.columns:
            raise ValueError("Training data must contain status information for target creation")
        
        df_processed.to_csv('data/to_train/final_training_data.csv', index=False)
        self.check_class_balance(df_processed)
        # Prepare features and target
        X = self.prepare_features(df_processed)
        y = df_processed['RTO_TARGET'].values
        
        logger.info(f"Training data shape: {X.shape}, Target distribution: {np.bincount(y)}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train multiple models and select the best
        models = {
            'RandomForest': RandomForestClassifier(
                n_estimators=100, max_depth=15, random_state=42, 
                class_weight='balanced', n_jobs=-1
            ),
            'GradientBoosting': GradientBoostingClassifier(
                n_estimators=100, max_depth=6, random_state=42
            ),
            'LogisticRegression': LogisticRegression(
                random_state=42, class_weight='balanced', max_iter=1000
            )
        }
        
        best_model = None
        best_score = 0
        model_results = {}
        
        for name, model in models.items():
            logger.info(f"Training {name}...")
            
            # Cross-validation
            cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='roc_auc')
            
            # Train on full training set
            model.fit(X_train_scaled, y_train)
            
            # Test predictions
            y_pred = model.predict(X_test_scaled)
            y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
            
            # Calculate metrics
            auc_score = roc_auc_score(y_test, y_pred_proba)
            
            model_results[name] = {
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std(),
                'test_auc': auc_score,
                'classification_report': classification_report(y_test, y_pred, output_dict=True)
            }
            
            logger.info(f"{name} - CV AUC: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}, Test AUC: {auc_score:.4f}")
            
            if auc_score > best_score:
                best_score = auc_score
                best_model = model
        
        self.model = best_model
        
        # Store historical data for similarity matching
        self.historical_data = df_processed.copy()
        
        # Calculate performance metrics
        self._calculate_performance_metrics(df_processed)
        
        # Save model snapshot
        self._save_model_snapshot()
        
        logger.info("Model training completed")
        
        return {
            'best_model': type(best_model).__name__,
            'best_score': best_score,
            'model_results': model_results,
            'feature_importance': self._get_feature_importance()
        }
    
    def predict(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Predict RTO probability for new orders
        
        Args:
            df: Dataframe with new order data
            
        Returns:
            Prediction results with explanations and recommendations
        """
        if self.model is None:
            raise ValueError("Model not trained. Please train the model first.")
        
        logger.info(f"Making predictions for {len(df)} orders...")
        
        # Preprocess prediction data
        df_processed = self.preprocess_data(df, is_training=False)
        
        # Prepare features
        X = self.prepare_features(df_processed)
        X_scaled = self.scaler.transform(X)
        
        # Make predictions
        predictions = self.model.predict(X_scaled)
        probabilities = self.model.predict_proba(X_scaled)[:, 1]
        
        # Generate explanations and recommendations
        results = []
        for i, (pred, prob) in enumerate(zip(predictions, probabilities)):
            order_data = df_processed.iloc[i]
            
            result = {
                'order_index': i,
                'order_number': str(order_data.ORDER_NUMBER),
                'order_current_status': str(order_data.CURRENT_STATUS),
                'payment_mode': str(order_data.PAYMENT_MODE),
                'cod_value': float(order_data.COLLECTABLE_AMOUNT),
                'order_created_at': str(order_data.ORDER_CREATION_DATE),
                'rto_prediction': bool(pred),
                'rto_probability': float(prob),
                'risk_level': self._get_risk_level(prob),
                'explanation': self._generate_explanation(order_data, prob),
                'recommendations': self._generate_recommendations(order_data, prob),
                'similar_orders': self._find_similar_orders(order_data)
            }
            results.append(result)
        
        logger.info("Predictions completed")
        
        return {
            'predictions': results,
            'summary': self._generate_summary(df_processed, predictions, probabilities)
        }
    
    def _get_risk_level(self, probability: float) -> str:
        """Categorize risk level based on probability"""
        if probability < 0.3:
            return "Low"
        elif probability < 0.7:
            return "Medium"
        else:
            return "High"
    
    def _generate_explanation(self, order_data: pd.Series, probability: float) -> str:
        """Generate explanation for the prediction"""
        
        explanations = []
        
        # Payment mode impact
        if order_data.get('IS_COD', 0) == 1:
            explanations.append("COD payment increases RTO risk")
        else:
            explanations.append("Prepaid payment reduces RTO risk")
        
        # Zone impact
        zone_risk = order_data.get('ZONE_RISK', 2)
        if zone_risk >= 3:
            explanations.append("Delivery to remote/special zone increases risk")
        
        # Address quality
        if order_data.get('ADDRESS_RISK_KEYWORDS', 0) == 1:
            explanations.append("Address contains risky keywords")
        
        # Phone validity
        if order_data.get('PHONE_VALID', 1) == 0:
            explanations.append("Invalid phone number format increases risk")
        
        # Value impact
        if order_data.get('HIGH_VALUE_ORDER', 0) == 1:
            explanations.append("High-value order may have higher scrutiny")
        
        return "; ".join(explanations) if explanations else "Standard risk factors detected"
    
    def _generate_recommendations(self, order_data: pd.Series, probability: float) -> List[str]:
        """Generate actionable recommendations"""
        
        recommendations = []
        
        if probability > 0.7:  # High risk
            recommendations.extend([
                "Consider calling customer to confirm address and availability",
                "Use premium courier service for better delivery success",
                "Send SMS/WhatsApp notifications before delivery attempt"
            ])
        
        if order_data.get('IS_COD', 0) == 1:
            recommendations.append("Encourage prepaid payment for better delivery rates")
        
        if order_data.get('PHONE_VALID', 1) == 0:
            recommendations.append("Verify and update customer phone number")
        
        if order_data.get('ADDRESS_RISK_KEYWORDS', 0) == 1:
            recommendations.append("Get detailed address with local landmarks")
        
        # Courier-specific recommendations
        courier = order_data.get('COURIER_NAME_ENCODED', 0)
        if courier in self.courier_performance:
            perf = self.courier_performance[courier]
            if perf.get('success_rate', 0.5) < 0.7:
                recommendations.append("Consider switching to a more reliable courier")
        
        return recommendations
    
    def _find_similar_orders(self, order_data: pd.Series) -> List[Dict]:
        """Find top 5 similar historical orders"""
        
        if self.historical_data is None or len(self.historical_data) == 0:
            return []
        
        # Select features for similarity calculation
        similarity_features = [
            'COURIER_NAME_ENCODED', 'CUSTOMER_CITY_ENCODED', 'ZONE_RISK',
            'IS_COD', 'WEIGHT_PER_ITEM', 'VALUE_PER_ITEM'
        ]
        
        available_features = [f for f in similarity_features if f in order_data.index]
        
        if not available_features:
            return []
        
        # Calculate similarity with historical orders
        order_vector = order_data[available_features].values.reshape(1, -1)
        historical_vectors = self.historical_data[available_features].values
        
        # Handle missing values
        order_vector = np.nan_to_num(order_vector)
        historical_vectors = np.nan_to_num(historical_vectors)
        
        # Calculate cosine similarities
        similarities = []
        for i, hist_vector in enumerate(historical_vectors):
            try:
                sim = 1 - cosine(order_vector.flatten(), hist_vector)
                similarities.append((i, sim))
            except:
                similarities.append((i, 0))
        
        # Get top 5 most similar orders
        similarities.sort(key=lambda x: x[1], reverse=True)
        top_similar = similarities[:5]
        
        similar_orders = []
        for idx, similarity in top_similar:
            hist_order = self.historical_data.iloc[idx]
            similar_orders.append({
                'similarity_score': float(similarity),
                'order_number': hist_order.get('ORDER_NUMBER', 'Unknown'),
                'status': hist_order.get('CURRENT_STATUS', 'Unknown'),
                'courier': hist_order.get('COURIER_NAME', 'Unknown'),
                'city': hist_order.get('CUSTOMER_CITY', 'Unknown'),
                'payment_mode': hist_order.get('PAYMENT_MODE', 'Unknown')
            })
        
        return similar_orders
    
    def _calculate_performance_metrics(self, df: pd.DataFrame):
        """Calculate courier and pincode performance metrics"""
        
        if 'CURRENT_STATUS' not in df.columns:
            return
        
        # Courier performance
        courier_stats = df.groupby('COURIER_NAME').agg({
            'RTO_TARGET': ['count', 'sum', 'mean'],
            'INVOICE_VALUE': 'mean',
            'TAT': 'mean'
        }).round(3)
        
        for courier in courier_stats.index:
            total_orders = courier_stats.loc[courier, ('RTO_TARGET', 'count')]
            rto_orders = courier_stats.loc[courier, ('RTO_TARGET', 'sum')]
            success_rate = 1 - courier_stats.loc[courier, ('RTO_TARGET', 'mean')]
            
            self.courier_performance[courier] = {
                'total_orders': int(total_orders),
                'rto_orders': int(rto_orders),
                'success_rate': float(success_rate),
                'avg_value': float(courier_stats.loc[courier, ('INVOICE_VALUE', 'mean')]),
                'avg_tat': float(courier_stats.loc[courier, ('TAT', 'mean')])
            }
        
        # Pincode performance
        pincode_stats = df.groupby('PINCODE').agg({
            'RTO_TARGET': ['count', 'sum', 'mean'],
            'COURIER_NAME': lambda x: x.mode().iloc[0] if not x.mode().empty else 'Unknown'
        }).round(3)
        
        for pincode in pincode_stats.index:
            total_orders = pincode_stats.loc[pincode, ('RTO_TARGET', 'count')]
            if total_orders >= 5:  # Only consider pincodes with sufficient data
                rto_rate = pincode_stats.loc[pincode, ('RTO_TARGET', 'mean')]
                self.pincode_stats[pincode] = {
                    'total_orders': int(total_orders),
                    'rto_rate': float(rto_rate),
                    'delivery_success_rate': float(1 - rto_rate),
                    'primary_courier': pincode_stats.loc[pincode, ('COURIER_NAME', '<lambda>')]
                }
    
    def _generate_summary(self, df: pd.DataFrame, predictions: np.ndarray, probabilities: np.ndarray) -> Dict:
        """Generate summary of predictions and insights"""
        
        total_orders = len(predictions)
        predicted_rto = np.sum(predictions)
        avg_risk = np.mean(probabilities)
        
        # Risk distribution
        high_risk = np.sum(probabilities > 0.7)
        medium_risk = np.sum((probabilities >= 0.3) & (probabilities <= 0.7))
        low_risk = np.sum(probabilities < 0.3)
        
        # Courier analysis
        courier_risk = {}
        if 'COURIER_NAME' in df.columns:
            for courier in df['COURIER_NAME'].unique():
                courier_mask = df['COURIER_NAME'] == courier
                courier_orders = np.sum(courier_mask)
                courier_avg_risk = np.mean(probabilities[courier_mask])
                courier_risk[courier] = {
                    'orders': int(courier_orders),
                    'avg_risk': float(courier_avg_risk)
                }
        
        return {
            'total_orders': int(total_orders),
            'predicted_rto': int(predicted_rto),
            'rto_rate': float(predicted_rto / total_orders),
            'average_risk_score': float(avg_risk),
            'risk_distribution': {
                'high_risk': int(high_risk),
                'medium_risk': int(medium_risk),
                'low_risk': int(low_risk)
            },
            'courier_risk_analysis': courier_risk
        }
    
    def _get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from the trained model"""
        
        if self.model is None or self.feature_columns is None:
            return {}
        
        try:
            if hasattr(self.model, 'feature_importances_'):
                importances = self.model.feature_importances_
            elif hasattr(self.model, 'coef_'):
                importances = np.abs(self.model.coef_[0])
            else:
                return {}
            
            feature_importance = dict(zip(self.feature_columns, importances))
            # Sort by importance
            feature_importance = dict(sorted(feature_importance.items(), 
                                           key=lambda x: x[1], reverse=True))
            
            return feature_importance
            
        except Exception as e:
            logger.error(f"Error getting feature importance: {e}")
            return {}
    
    def _save_model_snapshot(self):
        """Save model snapshot with timestamp"""
        
        timestamp = datetime.now().strftime("%Y_%m_%d")
        snapshot_dir = self.model_dir / timestamp
        snapshot_dir.mkdir(exist_ok=True)
        
        try:
            # Save model and preprocessors
            joblib.dump(self.model, snapshot_dir / "model.pkl")
            joblib.dump(self.label_encoders, snapshot_dir / "label_encoders.pkl")
            joblib.dump(self.scaler, snapshot_dir / "scaler.pkl")
            joblib.dump(self.feature_columns, snapshot_dir / "feature_columns.pkl")
            
            # Save performance metrics
            with open(snapshot_dir / "performance_metrics.json", 'w') as f:
                json.dump({
                    'courier_performance': dict(self.courier_performance),
                    'pincode_stats': dict(self.pincode_stats),
                    'feature_importance': self._get_feature_importance()
                }, f, indent=2)
            
            logger.info(f"Model snapshot saved to {snapshot_dir}")
            
        except Exception as e:
            logger.error(f"Error saving model snapshot: {e}")
    
    def load_model_snapshot(self, date: str = None):
        """Load model snapshot from specific date or latest"""
        
        if date is None:
            # Find latest snapshot
            snapshots = [d for d in self.model_dir.iterdir() if d.is_dir()]
            if not snapshots:
                raise ValueError("No model snapshots found")
            snapshot_dir = max(snapshots, key=lambda x: x.name)
        else:
            snapshot_dir = self.model_dir / date
            if not snapshot_dir.exists():
                raise ValueError(f"No snapshot found for date {date}")
        
        try:
            # Load model and preprocessors
            self.model = joblib.load(snapshot_dir / "model.pkl")
            self.label_encoders = joblib.load(snapshot_dir / "label_encoders.pkl")
            self.scaler = joblib.load(snapshot_dir / "scaler.pkl")
            self.feature_columns = joblib.load(snapshot_dir / "feature_columns.pkl")
            
            # Load performance metrics
            with open(snapshot_dir / "performance_metrics.json", 'r') as f:
                metrics = json.load(f)
                self.courier_performance = defaultdict(dict, metrics.get('courier_performance', {}))
                self.pincode_stats = defaultdict(dict, metrics.get('pincode_stats', {}))
            
            logger.info(f"Model snapshot loaded from {snapshot_dir}")
            
        except Exception as e:
            logger.error(f"Error loading model snapshot: {e}")
            raise
    
    def retrain_with_new_data(self, new_data: pd.DataFrame, retrain_threshold: float = 0.1):
        """
        Retrain model with new data if performance degradation is detected
        
        Args:
            new_data: New training data
            retrain_threshold: Minimum performance degradation to trigger retraining
        """
        logger.info("Checking if retraining is needed...")
        
        if self.model is None:
            logger.info("No existing model found. Training from scratch...")
            return self.train_model(new_data)
        
        # Evaluate current model on new data (if it has labels)
        if 'CURRENT_STATUS' in new_data.columns:
            new_data_processed = self.preprocess_data(new_data, is_training=True)
            X_new = self.prepare_features(new_data_processed)
            y_new = new_data_processed['RTO_TARGET'].values
            
            if len(X_new) > 0:
                X_new_scaled = self.scaler.transform(X_new)
                current_score = roc_auc_score(y_new, self.model.predict_proba(X_new_scaled)[:, 1])
                
                # If performance degradation exceeds threshold, retrain
                baseline_score = getattr(self, 'last_training_score', 0.8)
                if (baseline_score - current_score) > retrain_threshold:
                    logger.info(f"Performance degraded from {baseline_score:.4f} to {current_score:.4f}. Retraining...")
                    
                    # Combine with historical data if available
                    if self.historical_data is not None:
                        combined_data = pd.concat([self.historical_data, new_data], ignore_index=True)
                    else:
                        combined_data = new_data
                    
                    return self.train_model(combined_data)
                else:
                    logger.info(f"Performance acceptable ({current_score:.4f}). No retraining needed.")
                    return None
        
        # If no performance evaluation possible, just add to historical data
        logger.info("Adding new data to historical dataset...")
        if self.historical_data is not None:
            self.historical_data = pd.concat([self.historical_data, new_data], ignore_index=True)
        else:
            self.historical_data = new_data.copy()
        
        return None
    
    def get_courier_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive courier performance report"""
        
        report = {
            'total_couriers': len(self.courier_performance),
            'courier_rankings': [],
            'recommendations': []
        }
        
        # Sort couriers by success rate
        sorted_couriers = sorted(
            self.courier_performance.items(),
            key=lambda x: x[1].get('success_rate', 0),
            reverse=True
        )
        
        for courier, stats in sorted_couriers:
            courier_info = {
                'courier_name': courier,
                'success_rate': stats.get('success_rate', 0),
                'total_orders': stats.get('total_orders', 0),
                'rto_orders': stats.get('rto_orders', 0),
                'avg_order_value': stats.get('avg_value', 0),
                'avg_tat': stats.get('avg_tat', 0),
                'performance_grade': self._get_performance_grade(stats.get('success_rate', 0))
            }
            report['courier_rankings'].append(courier_info)
        
        # Generate recommendations
        if sorted_couriers:
            best_courier = sorted_couriers[0]
            worst_courier = sorted_couriers[-1]
            
            if best_courier[1].get('success_rate', 0) > 0.85:
                report['recommendations'].append(
                    f"Consider increasing volume with {best_courier[0]} (success rate: {best_courier[1].get('success_rate', 0):.2%})"
                )
            
            if worst_courier[1].get('success_rate', 0) < 0.6:
                report['recommendations'].append(
                    f"Review partnership with {worst_courier[0]} (success rate: {worst_courier[1].get('success_rate', 0):.2%})"
                )
        
        return report
    
    def get_pincode_analysis(self, pincode: str = None) -> Dict[str, Any]:
        """Get delivery analysis for specific pincode or all pincodes"""
        
        if pincode:
            if pincode in self.pincode_stats:
                return {
                    'pincode': pincode,
                    'stats': self.pincode_stats[pincode],
                    'recommendation': self._get_pincode_recommendation(self.pincode_stats[pincode])
                }
            else:
                return {'pincode': pincode, 'message': 'No historical data available'}
        
        # Return analysis for all pincodes
        analysis = {
            'total_pincodes_analyzed': len(self.pincode_stats),
            'high_risk_pincodes': [],
            'low_risk_pincodes': [],
            'summary': {}
        }
        
        rto_rates = [stats['rto_rate'] for stats in self.pincode_stats.values()]
        if rto_rates:
            analysis['summary'] = {
                'avg_rto_rate': np.mean(rto_rates),
                'median_rto_rate': np.median(rto_rates),
                'max_rto_rate': np.max(rto_rates),
                'min_rto_rate': np.min(rto_rates)
            }
        
        # Categorize pincodes
        for pincode, stats in self.pincode_stats.items():
            if stats['rto_rate'] > 0.3:  # High risk
                analysis['high_risk_pincodes'].append({
                    'pincode': pincode,
                    'rto_rate': stats['rto_rate'],
                    'total_orders': stats['total_orders']
                })
            elif stats['rto_rate'] < 0.1:  # Low risk
                analysis['low_risk_pincodes'].append({
                    'pincode': pincode,
                    'rto_rate': stats['rto_rate'],
                    'total_orders': stats['total_orders']
                })
        
        return analysis
    
    def _get_performance_grade(self, success_rate: float) -> str:
        """Get performance grade based on success rate"""
        if success_rate >= 0.9:
            return "A+"
        elif success_rate >= 0.8:
            return "A"
        elif success_rate >= 0.7:
            return "B"
        elif success_rate >= 0.6:
            return "C"
        else:
            return "D"
    
    def _get_pincode_recommendation(self, stats: Dict) -> str:
        """Get recommendation for a specific pincode"""
        rto_rate = stats.get('rto_rate', 0)
        total_orders = stats.get('total_orders', 0)
        
        if total_orders < 10:
            return "Insufficient data for reliable analysis"
        elif rto_rate > 0.3:
            return "High-risk pincode. Consider premium courier or customer verification"
        elif rto_rate < 0.1:
            return "Low-risk pincode. Reliable delivery area"
        else:
            return "Moderate risk. Standard delivery procedures recommended"


# Main Pipeline Class
class RTOPipelineManager:
    """
    Main pipeline manager for end-to-end RTO prediction workflow
    """
    
    def __init__(self, config_path: str = None):
        """Initialize pipeline manager with configuration"""
        
        self.predictor = RTOPredictor()
        self.config = self._load_config(config_path)
        self.setup_directories()
        
        logger.info("RTO Pipeline Manager initialized")
    
    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from file or use defaults"""
        
        default_config = {
            'data_dir': 'data',
            'model_dir': 'models',
            'output_dir': 'output',
            'retrain_schedule': 'daily',
            'retrain_threshold': 0.1,
            'min_training_samples': 100
        }
        
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                user_config = json.load(f)
                default_config.update(user_config)
        
        return default_config
    
    def setup_directories(self):
        """Setup required directories"""
        
        for dir_name in ['data_dir', 'model_dir', 'output_dir']:
            Path(self.config[dir_name]).mkdir(exist_ok=True)
    
    def process_new_orders(self, csv_path: str) -> Dict[str, Any]:
        """
        Process new orders from CSV file
        
        Args:
            csv_path: Path to CSV file with new orders
            
        Returns:
            Prediction results
        """
        logger.info(f"Processing new orders from {csv_path}")
        
        try:
            # Read CSV
            df = pd.read_csv(csv_path)
            logger.info(f"Loaded {len(df)} orders from CSV")
            
            # Load latest model if not already loaded
            if self.predictor.model is None:
                try:
                    self.predictor.load_model_snapshot()
                    logger.info("Loaded latest model snapshot")
                except Exception as e:
                    logger.error(f"No trained model found: {e}")
                    raise ValueError("No trained model available. Please train the model first.")
            
            # Make predictions
            results = self.predictor.predict(df)
            
            # Save results
            self._save_prediction_results(results, csv_path)
            
            return results
            
        except Exception as e:
            logger.error(f"Error processing new orders: {e}")
            raise
    
    def train_initial_model(self, training_data_path: str) -> Dict[str, Any]:
        """
        Train initial model with historical data
        
        Args:
            training_data_path: Path to historical training data CSV
            
        Returns:
            Training results
        """
        logger.info(f"Training initial model with data from {training_data_path}")
        
        try:
            # Read training data
            df = pd.read_csv(training_data_path)
            logger.info(f"Loaded {len(df)} records for training")
            
            if len(df) < self.config['min_training_samples']:
                raise ValueError(f"Insufficient training data. Need at least {self.config['min_training_samples']} samples")
            
            # Train model
            results = self.predictor.train_model(df)
            
            # Save training results
            self._save_training_results(results)
            
            return results
            
        except Exception as e:
            logger.error(f"Error training model: {e}")
            raise
    

    def daily_retrain(self, new_data_path: str = None) -> Dict[str, Any]:
        """
        Perform daily retraining if needed
        
        Args:
            new_data_path: Path to new training data (optional)
            
        Returns:
            Retraining results or None if no retraining needed
        """
        logger.info("Starting daily retrain process")
        
        if new_data_path and os.path.exists(new_data_path):
            new_data = pd.read_csv(new_data_path)
            return self.predictor.retrain_with_new_data(
                new_data, 
                self.config['retrain_threshold']
            )
        else:
            logger.info("No new training data provided for retraining")
            return None
    
    def generate_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report"""
        
        logger.info("Generating performance report")
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'courier_performance': self.predictor.get_courier_performance_report(),
            'pincode_analysis': self.predictor.get_pincode_analysis(),
            'model_info': {
                'model_type': type(self.predictor.model).__name__ if self.predictor.model else None,
                'feature_count': len(self.predictor.feature_columns) if self.predictor.feature_columns else 0,
                'feature_importance': self.predictor._get_feature_importance()
            }
        }
        
        # Save report
        report_path = Path(self.config['output_dir']) / f"performance_report_{datetime.now().strftime('%Y%m%d')}.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Performance report saved to {report_path}")
        
        return report
    
    def _save_prediction_results(self, results: Dict, original_csv_path: str):
        """Save prediction results to file"""
        
        timestamp = datetime.now().strftime('%Y%m%d_%H')
        output_file = Path(self.config['output_dir']) / f"predictions_{timestamp}.json"
        
        # Also create a summary CSV
        summary_data = []
        for pred in results['predictions']:
            summary_data.append({
                'order_index': pred['order_index'],
                'order_number': pred['order_number'],
                'order_current_status': pred['order_current_status'],
                'payment_mode': pred['payment_mode'],
                'cod_value': pred['cod_value'],
                'order_created_at': pred['order_created_at'],
                'rto_prediction': pred['rto_prediction'],
                'rto_probability': pred['rto_probability'],
                'risk_level': pred['risk_level']
            })
        
        summary_df = pd.DataFrame(summary_data)
        summary_csv = Path(self.config['output_dir']) / f"prediction_summary_{timestamp}.csv"
        
        # Save both files
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        summary_df.to_csv(summary_csv, index=False)
        
        logger.info(f"Prediction results saved to {output_file} and {summary_csv}")
    
    def _save_training_results(self, results: Dict):
        """Save training results to file"""
        
        timestamp = datetime.now().strftime('%Y%m%d')
        output_file = Path(self.config['output_dir']) / f"training_results_{timestamp}.json"
        
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Training results saved to {output_file}")


# Example usage and testing
def main():
    """Main function demonstrating pipeline usage"""
    
    # Initialize pipeline
    pipeline = RTOPipelineManager()
    
    # Example: Train initial model (uncomment when you have training data)
    training_results = pipeline.train_initial_model(r'data/to_train/training_data_2025_05_23.csv')
    print("Training completed:", training_results['best_model'])
    
    # # Example: Process new orders (uncomment when you have new orders)
    prediction_results = pipeline.process_new_orders('data/to_predict/predict_2025_06_03.csv')
    print(f"Processed {len(prediction_results['predictions'])} orders")
    
    # Example: Generate performance report
    report = pipeline.generate_performance_report()
    print("Performance report generated")
    
    print("RTO Prediction Pipeline is ready for use!")
    print("\nTo use the pipeline:")
    print("1. Prepare your training data CSV with historical orders")
    print("2. Call pipeline.train_initial_model('your_training_data.csv')")
    print("3. Process new orders with pipeline.process_new_orders('new_orders.csv')")
    print("4. Set up daily retraining with pipeline.daily_retrain()")


if __name__ == "__main__":
    main()