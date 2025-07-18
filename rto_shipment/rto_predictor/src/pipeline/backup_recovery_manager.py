"""
Backup and Recovery Management Module
Handles model backup, recovery, and snapshot management
"""

import joblib
from pathlib import Path
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class BackupRecoveryManager:
    """
    Handles all backup and recovery operations for models and data
    """
    
    def __init__(self, pipeline_config):
        self.pipeline_config = pipeline_config
    
    def create_backup(self, model_trainer, data_preprocessor):
        """Create backup of current model before training"""
        if model_trainer.model is not None:
            try:
                backup_dir = Path(self.pipeline_config.backup_dir) / datetime.now().strftime('%Y_%m_%d_%H')
                backup_dir.mkdir(exist_ok=True)
                
                joblib.dump(model_trainer.model, backup_dir / "model_backup.pkl")
                joblib.dump(data_preprocessor.label_encoders, backup_dir / "encoders_backup.pkl")
                joblib.dump(data_preprocessor.scaler, backup_dir / "scaler_backup.pkl")
                
                logger.info(f"Model backup created at: {backup_dir}")
                return str(backup_dir)
                
            except Exception as e:
                logger.warning(f"Failed to create backup: {e}")
                return None
        return None
    
    def restore_backup(self, backup_path: str, model_trainer, data_preprocessor):
        """Restore model from backup"""
        try:
            backup_dir = Path(backup_path)
            
            if not backup_dir.exists():
                raise FileNotFoundError(f"Backup directory not found: {backup_path}")
            
            # Restore model components
            model_trainer.model = joblib.load(backup_dir / "model_backup.pkl")
            data_preprocessor.label_encoders = joblib.load(backup_dir / "encoders_backup.pkl")
            data_preprocessor.scaler = joblib.load(backup_dir / "scaler_backup.pkl")
            
            logger.info(f"Model restored from backup: {backup_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to restore backup: {e}")
            return False
    
    def list_available_backups(self):
        """List all available backup directories"""
        try:
            backup_dir = Path(self.pipeline_config.backup_dir)
            if not backup_dir.exists():
                return []
            
            backups = [d.name for d in backup_dir.iterdir() if d.is_dir()]
            backups.sort(reverse=True)  # Most recent first
            
            return backups
            
        except Exception as e:
            logger.error(f"Error listing backups: {e}")
            return []
    
    def cleanup_old_backups(self, max_backups: int = 10):
        """Clean up old backup directories"""
        try:
            backups = self.list_available_backups()
            
            if len(backups) > max_backups:
                backups_to_remove = backups[max_backups:]
                backup_dir = Path(self.pipeline_config.backup_dir)
                
                for backup_name in backups_to_remove:
                    backup_path = backup_dir / backup_name
                    if backup_path.exists():
                        import shutil
                        shutil.rmtree(backup_path)
                        logger.info(f"Removed old backup: {backup_name}")
                        
        except Exception as e:
            logger.error(f"Error cleaning up backups: {e}")