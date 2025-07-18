# Custom Exceptions
class RTOPipelineError(Exception):
    """Base exception for RTO Pipeline"""
    pass

class DataValidationError(RTOPipelineError):
    """Data validation failed"""
    pass

class ModelNotFoundError(RTOPipelineError):
    """Model not found or not trained"""
    pass

class ProcessingTimeoutError(RTOPipelineError):
    """Processing timeout exceeded"""
    pass

class DataQualityError(RTOPipelineError):
    """Data quality issues detected"""
    pass

class ServiceUnavailableError(RTOPipelineError):
    """Service is temporarily unavailable"""
    pass
