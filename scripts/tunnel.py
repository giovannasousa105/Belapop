"""
Pequeno helper para abrir um túnel ngrok e expor a API local.

Uso:
  py scripts/tunnel.py [porta]

Pré-requisitos:
- pyngrok instalado (já instalado nesta máquina).
- NGROK_AUTHTOKEN configurado em variável de ambiente ou no .env.
"""

import os
import sys
from contextlib import suppress

from pyngrok import ngrok


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

    # Seta authtoken se existir.
    token = os.getenv("NGROK_AUTHTOKEN")
    if token:
        ngrok.set_auth_token(token)

    tunnel = ngrok.connect(port, bind_tls=True)
    print(f"\nTúnel aberto: {tunnel.public_url}")
    print("Webhook Stripe:", f"{tunnel.public_url}/payments/webhook/stripe")
    print("Pressione Ctrl+C para encerrar o túnel.")

    try:
        # Mantém processo vivo.
        ngrok_process = ngrok.get_ngrok_process()
        ngrok_process.proc.wait()
    except KeyboardInterrupt:
        print("\nEncerrando...")
    finally:
        with suppress(Exception):
            ngrok.disconnect(tunnel.public_url)
        with suppress(Exception):
            ngrok.kill()


if __name__ == "__main__":
    main()
