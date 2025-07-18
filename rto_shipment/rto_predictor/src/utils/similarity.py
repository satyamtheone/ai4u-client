 def _find_similar_orders(self, order_data: pd.Series) -> List[Dict]:
        """Find top 5 similar historical orders with error handling"""
        
        if self.historical_data is None or len(self.historical_data) == 0:
            return []
        
        try:
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
                    'order_number': str(hist_order.get('ORDER_NUMBER', 'Unknown')),
                    'status': str(hist_order.get('CURRENT_STATUS', 'Unknown')),
                    'courier': str(hist_order.get('COURIER_NAME', 'Unknown')),
                    'city': str(hist_order.get('CUSTOMER_CITY', 'Unknown')),
                    'payment_mode': str(hist_order.get('PAYMENT_MODE', 'Unknown'))
                })
            
            return similar_orders
            
        except Exception as e:
            logger.warning(f"Error finding similar orders: {e}")
            return []