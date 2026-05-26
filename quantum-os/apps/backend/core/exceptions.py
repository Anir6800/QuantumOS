from fastapi import Request
from fastapi.responses import JSONResponse

class QuantumOSException(Exception):
    def __init__(self, message: str, session_id: str = None):
        self.message = message
        self.session_id = session_id
        super().__init__(self.message)

class SessionNotFoundException(QuantumOSException):
    pass

class AgentNotFoundException(QuantumOSException):
    pass

class AgentExecutionError(QuantumOSException):
    pass

async def global_exception_handler(request: Request, exc: QuantumOSException):
    content = {"error": exc.__class__.__name__, "message": exc.message}
    if exc.session_id:
        content["session_id"] = exc.session_id
    
    status_code = 500
    if isinstance(exc, (SessionNotFoundException, AgentNotFoundException)):
        status_code = 404
    elif isinstance(exc, AgentExecutionError):
        status_code = 400
        
    return JSONResponse(status_code=status_code, content=content)
