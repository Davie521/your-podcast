FROM python:3.12-slim

RUN pip install --no-cache-dir fastapi uvicorn

WORKDIR /app

CMD ["python", "-c", "from http.server import HTTPServer, BaseHTTPRequestHandler; import os; port=int(os.environ.get('PORT',8000)); print(f'Starting on {port}'); HTTPServer(('0.0.0.0',port), BaseHTTPRequestHandler).serve_forever()"]
