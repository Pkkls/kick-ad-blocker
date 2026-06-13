#!/usr/bin/env python3
"""
pc_relay.py — Relai HTTP à faire tourner sur le PC Windows/Linux.
Lance-le au démarrage de Windows (Tâche planifiée) ou avec systemd.

Écoute sur 0.0.0.0:8765 (accessible depuis le LAN).
Authentification par token partagé avec le bot.
"""

import os
import sys
import json
import subprocess
import platform
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# ─── Config ──────────────────────────────────────────────────────────────────
PORT   = int(os.environ.get("RELAY_PORT", 8765))
TOKEN  = os.environ.get("RELAY_TOKEN", "")          # OBLIGATOIRE : définis RELAY_TOKEN

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("pc_relay")

# ─── Commandes OS ────────────────────────────────────────────────────────────
def _shutdown_cmd():
    if platform.system() == "Windows":
        return ["shutdown", "/s", "/t", "5", "/c", "Arrêt demandé par Nano Bot"]
    return ["shutdown", "-h", "+0"]    # Linux/macOS


def _reboot_cmd():
    if platform.system() == "Windows":
        return ["shutdown", "/r", "/t", "5"]
    return ["reboot"]


# ─── Gestionnaire HTTP ────────────────────────────────────────────────────────
class RelayHandler(BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        log.info("%s - %s", self.address_string(), fmt % args)

    def _auth(self):
        """Vérifie le token dans le header Authorization ou le query param."""
        if not TOKEN:
            log.warning("RELAY_TOKEN vide — relai non sécurisé !")
            return True
        header = self.headers.get("Authorization", "")
        if header == f"Bearer {TOKEN}":
            return True
        qs = parse_qs(urlparse(self.path).query)
        return qs.get("token", [""])[0] == TOKEN

    def _send_json(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/ping":
            self._send_json(200, {"ok": True, "host": platform.node()})
        else:
            self._send_json(404, {"ok": False, "error": "Not found"})

    def do_POST(self):
        path = urlparse(self.path).path

        if not self._auth():
            self._send_json(403, {"ok": False, "error": "Token invalide"})
            return

        if path == "/shutdown":
            self._send_json(200, {"ok": True, "msg": "Arrêt dans 5 secondes…"})
            log.info("Arrêt demandé — exécution de la commande OS")
            subprocess.Popen(_shutdown_cmd())

        elif path == "/reboot":
            self._send_json(200, {"ok": True, "msg": "Redémarrage dans 5 secondes…"})
            log.info("Redémarrage demandé")
            subprocess.Popen(_reboot_cmd())

        else:
            self._send_json(404, {"ok": False, "error": "Route inconnue"})


# ─── Entrée ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if not TOKEN:
        log.warning("⚠  RELAY_TOKEN non défini — définis la variable d'env pour sécuriser le relai.")

    server = HTTPServer(("0.0.0.0", PORT), RelayHandler)
    log.info("Relai démarré sur 0.0.0.0:%d (OS: %s)", PORT, platform.system())
    log.info("Endpoints : GET /ping | POST /shutdown | POST /reboot")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        log.info("Relai arrêté.")
