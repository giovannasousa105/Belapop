"""
Worker simples para processar eventos de pagamento enfileirados (Redis).

Uso:
  set REDIS_URL
  py scripts/worker.py

O worker fica lendo a lista "webhook_events" e chama o processador
compartilhado de pagamentos (process_payment_event) usando a mesma
base SQLAlchemy do app.
"""

import json
import os
import sys
import time
from typing import Optional

import redis

from database import SessionLocal
from main import process_payment_event


def main() -> None:
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        print("Defina REDIS_URL para usar o worker.")
        sys.exit(1)

    r = redis.from_url(redis_url)
    print("Worker iniciado. Aguardando eventos em 'webhook_events'...")

    while True:
        try:
            item: Optional[bytes] = r.brpop("webhook_events", timeout=5)
            if not item:
                continue
            _, payload = item  # tuple (list_name, data)
            data = json.loads(payload)
            event_type = data.get("event_type")
            obj = data.get("payload")
            if not event_type or not obj:
                continue
            db = SessionLocal()
            try:
                process_payment_event(db, event_type, obj)
            finally:
                db.close()
        except KeyboardInterrupt:
            print("\nEncerrando worker...")
            break
        except Exception as exc:  # noqa: BLE001
            print(f"[worker] erro: {exc}")
            time.sleep(2)


if __name__ == "__main__":
    main()
