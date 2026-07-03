import time
import socket
import threading

import uvicorn
import webview

from main import app


HOST = "127.0.0.1"
PORT = 8000
URL = f"http://{HOST}:{PORT}"

# Função para aguardar o servidor local estar disponível
def aguardar_servidor(host=HOST, port=PORT, timeout=30):
    inicio = time.time()

    while time.time() - inicio < timeout:
        try:
            with socket.create_connection((host, port), timeout=1):
                return True
        except OSError:
            time.sleep(0.5)

    return False

# Função para iniciar a API FastAPI usando Uvicorn
def iniciar_api():
    uvicorn.run(
        app,
        host=HOST,
        port=PORT,
        reload=False,
        log_level="error"
    )

# Função principal para iniciar o servidor e a interface web
def main():
    servidor = threading.Thread(target=iniciar_api, daemon=True)
    servidor.start()

    if not aguardar_servidor():
        raise RuntimeError("Não foi possível iniciar o servidor local.")

    webview.create_window(
        title="Localidade Risco",
        url=URL,
        width=1400,
        height=900,
        resizable=True
    )

    webview.start(debug=False)


if __name__ == "__main__":
    main()