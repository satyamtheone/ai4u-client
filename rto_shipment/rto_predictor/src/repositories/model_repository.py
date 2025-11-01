"""
Model Repository - Abstract Model Storage/Retrieval
Implements Repository Pattern for model persistence
"""

import joblib
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)


@dataclass
class ModelMetadata:
    """Model metadata structure"""
    version: str
    model_type: str
    accuracy: float
    created_at: str
    feature_count: int
    training_samples: int
    has_encoders: bool = False
    has_scaler: bool = False


class ModelRepository:
    """
    Repository Pattern for Model Storage

    Abstracts model persistence from business logic
    Makes services independent of storage implementation
    """

    def __init__(self, model_dir: str):
        """
        Initialize repository with storage location

        Args:
            model_dir: Directory to store models
        """
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"ModelRepository initialized with directory: {model_dir}")

    def save_model(
        self,
        model: Any,
        scaler: Any,
        feature_columns: List[str],
        label_encoders: Dict[str, Any],
        metadata: Dict[str, Any]
    ) -> str:
        """
        Save model and all associated artifacts

        Args:
            model: Trained model object
            scaler: Fitted scaler
            feature_columns: List of feature names
            label_encoders: Dictionary of label encoders
            metadata: Model metadata (accuracy, type, etc.)

        Returns:
            Model version string
        """
        try:
            # Generate version (timestamp-based)
            version = datetime.now().strftime("%Y_%m_%d_%H")
            model_path = self.model_dir / version
            model_path.mkdir(parents=True, exist_ok=True)

            # Save model artifacts
            joblib.dump(model, model_path / "model.pkl")
            joblib.dump(scaler, model_path / "scaler.pkl")
            joblib.dump(feature_columns, model_path / "feature_columns.pkl")

            if label_encoders:
                joblib.dump(label_encoders, model_path / "label_encoders.pkl")
                logger.info(f"Saved {len(label_encoders)} label encoders")

            # Save metadata
            metadata_obj = ModelMetadata(
                version=version,
                model_type=metadata.get('model_type', 'Unknown'),
                accuracy=metadata.get('accuracy', 0.0),
                created_at=datetime.now().isoformat(),
                feature_count=len(feature_columns),
                training_samples=metadata.get('training_samples', 0),
                has_encoders=label_encoders is not None and len(label_encoders) > 0,
                has_scaler=scaler is not None
            )

            with open(model_path / "metadata.json", 'w') as f:
                json.dump(asdict(metadata_obj), f, indent=2)

            # Create 'latest' symlink
            latest_link = self.model_dir / "latest"
            if latest_link.exists() or latest_link.is_symlink():
                latest_link.unlink()
            latest_link.symlink_to(version)

            logger.info(f"Model saved successfully: {version}")
            return version

        except Exception as e:
            logger.error(f"Failed to save model: {e}")
            raise

    def load_model(self, version: str = "latest") -> Tuple[Any, Any, List[str], Dict[str, Any], ModelMetadata]:
        """
        Load model and all associated artifacts

        Args:
            version: Model version to load (default: "latest")

        Returns:
            Tuple of (model, scaler, feature_columns, label_encoders, metadata)
        """
        try:
            # Resolve version path
            if version == "latest":
                latest_link = self.model_dir / "latest"
                if not latest_link.exists():
                    raise FileNotFoundError("No model found. Please train a model first.")
                model_path = latest_link.resolve()
            else:
                model_path = self.model_dir / version
                if not model_path.exists():
                    raise FileNotFoundError(f"Model version {version} not found")

            # Load model artifacts
            model = joblib.load(model_path / "model.pkl")
            scaler = joblib.load(model_path / "scaler.pkl")
            feature_columns = joblib.load(model_path / "feature_columns.pkl")

            # Load label encoders if available
            label_encoders_file = model_path / "label_encoders.pkl"
            label_encoders = {}
            if label_encoders_file.exists():
                label_encoders = joblib.load(label_encoders_file)
                logger.info(f"Loaded {len(label_encoders)} label encoders")
            else:
                logger.warning("No label encoders found in model snapshot")

            # Load metadata
            metadata_file = model_path / "metadata.json"
            if metadata_file.exists():
                with open(metadata_file, 'r') as f:
                    metadata_dict = json.load(f)
                    metadata = ModelMetadata(**metadata_dict)
            else:
                # Create minimal metadata if file doesn't exist
                metadata = ModelMetadata(
                    version=model_path.name,
                    model_type="Unknown",
                    accuracy=0.0,
                    created_at=datetime.now().isoformat(),
                    feature_count=len(feature_columns),
                    training_samples=0
                )

            logger.info(f"Model loaded successfully: {model_path.name}")
            return model, scaler, feature_columns, label_encoders, metadata

        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    def list_models(self) -> List[Dict[str, Any]]:
        """
        List all available models

        Returns:
            List of model metadata dictionaries
        """
        try:
            models = []
            for model_dir in self.model_dir.iterdir():
                if model_dir.is_dir() and model_dir.name != "latest":
                    metadata_file = model_dir / "metadata.json"
                    if metadata_file.exists():
                        with open(metadata_file, 'r') as f:
                            metadata = json.load(f)
                            models.append(metadata)
                    else:
                        # Create basic metadata for models without metadata file
                        models.append({
                            'version': model_dir.name,
                            'model_type': 'Unknown',
                            'accuracy': 0.0,
                            'created_at': datetime.fromtimestamp(
                                model_dir.stat().st_ctime
                            ).isoformat()
                        })

            # Sort by creation date (newest first)
            models.sort(key=lambda x: x.get('created_at', ''), reverse=True)
            return models

        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            return []

    def delete_model(self, version: str) -> bool:
        """
        Delete a specific model version

        Args:
            version: Model version to delete

        Returns:
            True if successful, False otherwise
        """
        try:
            if version == "latest":
                logger.warning("Cannot delete 'latest' symlink directly")
                return False

            model_path = self.model_dir / version
            if not model_path.exists():
                logger.warning(f"Model version {version} not found")
                return False

            # Remove directory and all contents
            import shutil
            shutil.rmtree(model_path)

            logger.info(f"Model {version} deleted successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to delete model: {e}")
            return False

    def get_latest_version(self) -> Optional[str]:
        """
        Get the latest model version

        Returns:
            Latest version string or None if no models exist
        """
        try:
            latest_link = self.model_dir / "latest"
            if latest_link.exists():
                return latest_link.resolve().name
            return None
        except Exception as e:
            logger.error(f"Failed to get latest version: {e}")
            return None

    def model_exists(self, version: str = "latest") -> bool:
        """
        Check if a model version exists

        Args:
            version: Model version to check

        Returns:
            True if model exists, False otherwise
        """
        try:
            if version == "latest":
                latest_link = self.model_dir / "latest"
                return latest_link.exists()
            else:
                model_path = self.model_dir / version
                return model_path.exists() and (model_path / "model.pkl").exists()
        except Exception as e:
            logger.error(f"Failed to check model existence: {e}")
            return False
