# Enhanced logging setup
def setup_production_logging(log_dir: str = "logs"):
    """Setup production-grade logging"""
    Path(log_dir).mkdir(exist_ok=True)
    
    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s - [%(filename)s:%(lineno)d]',
        handlers=[
            logging.FileHandler(Path(log_dir) / 'rto_pipeline.log'),
            logging.FileHandler(Path(log_dir) / f'rto_pipeline_{datetime.now().strftime("%Y%m%d")}.log'),
            logging.StreamHandler()
        ]
    )
    
    # Create separate loggers for different components
    error_logger = logging.getLogger('error')
    error_handler = logging.FileHandler(Path(log_dir) / 'errors.log')
    error_handler.setLevel(logging.ERROR)
    error_logger.addHandler(error_handler)
    
    performance_logger = logging.getLogger('performance')
    perf_handler = logging.FileHandler(Path(log_dir) / 'performance.log')
    performance_logger.addHandler(perf_handler)
    
    return logging.getLogger(__name__)
