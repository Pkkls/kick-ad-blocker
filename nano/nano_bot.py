#!/usr/bin/env python3
"""
nano_bot.py — Bot Telegram « Pkkls Nano ».
Commandes : /status  /shutdown  /reboot  /help
"""

import os
import subprocess
import logging
import asyncio
import aiohttp
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

load_dotenv()

# ─── Config (variables d'environnement) ──────────────────────────────────────
BOT_TOKEN    = os.environ["TELEGRAM_BOT_TOKEN"]
ALLOWED_IDS  = set(map(int, os.environ["ALLOWED_USER_IDS"].split(",")))  # ex: "123456789,987654321"
PC_HOST      = os.environ.get("PC_HOST", "192.168.1.6")
RELAY_PORT   = int(os.environ.get("RELAY_PORT", "8765"))
RELAY_TOKEN  = os.environ.get("RELAY_TOKEN", "")
RELAY_TIMEOUT = 5   # secondes

RELAY_BASE = f"http://{PC_HOST}:{RELAY_PORT}"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("nano_bot")


# ─── Helpers ─────────────────────────────────────────────────────────────────
def _auth_headers():
    if RELAY_TOKEN:
        return {"Authorization": f"Bearer {RELAY_TOKEN}"}
    return {}


def _is_pc_online() -> bool:
    """Ping ICMP rapide (1 paquet, timeout 1 s)."""
    cmd = ["ping", "-c", "1", "-W", "1", PC_HOST]
    try:
        return subprocess.call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0
    except FileNotFoundError:
        # Windows
        cmd = ["ping", "-n", "1", "-w", "1000", PC_HOST]
        return subprocess.call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0


async def _relay_get(path: str):
    """GET sur le relai. Retourne (ok: bool, data: dict)."""
    url = f"{RELAY_BASE}{path}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=_auth_headers(), timeout=aiohttp.ClientTimeout(total=RELAY_TIMEOUT)) as r:
                return True, await r.json()
    except aiohttp.ClientConnectorError:
        return False, {"error": "connexion refusée"}
    except asyncio.TimeoutError:
        return False, {"error": "timeout"}
    except Exception as e:
        return False, {"error": str(e)}


async def _relay_post(path: str):
    """POST sur le relai. Retourne (ok: bool, data: dict)."""
    url = f"{RELAY_BASE}{path}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=_auth_headers(), timeout=aiohttp.ClientTimeout(total=RELAY_TIMEOUT)) as r:
                return r.status == 200, await r.json()
    except aiohttp.ClientConnectorError:
        return False, {"error": "connexion refusée"}
    except asyncio.TimeoutError:
        return False, {"error": "timeout"}
    except Exception as e:
        return False, {"error": str(e)}


def _guard(update: Update) -> bool:
    """Bloque les utilisateurs non autorisés."""
    uid = update.effective_user.id
    if uid not in ALLOWED_IDS:
        log.warning("Accès refusé : user_id=%d", uid)
        return False
    return True


# ─── Commandes ───────────────────────────────────────────────────────────────
async def cmd_help(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not _guard(update):
        return
    await update.message.reply_text(
        "🖥 *Pkkls Nano — commandes disponibles*\n\n"
        "/status — Vérifie si le PC est en ligne et si le relai répond\n"
        "/shutdown — Éteint le PC via le relai\n"
        "/reboot — Redémarre le PC via le relai",
        parse_mode="Markdown",
    )


async def cmd_status(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not _guard(update):
        return

    online = _is_pc_online()
    if not online:
        await update.message.reply_text(f"❌ PC hors ligne ({PC_HOST})")
        return

    ok, data = await _relay_get("/ping")
    if ok:
        host = data.get("host", "?")
        await update.message.reply_text(
            f"✅ PC en ligne ({PC_HOST})\n"
            f"✅ Relai opérationnel — hôte : `{host}`",
            parse_mode="Markdown",
        )
    else:
        err = data.get("error", "inconnu")
        await update.message.reply_text(
            f"✅ PC en ligne ({PC_HOST})\n"
            f"❌ Relai PC injoignable : *{err}*\n\n"
            f"Vérifie que `pc_relay.py` tourne sur le PC :\n"
            f"`python pc_relay.py`  (port {RELAY_PORT})\n\n"
            f"Si le relai tourne mais est injoignable, vérifie :\n"
            f"• Pare-feu Windows → autoriser le port {RELAY_PORT}\n"
            f"• Que `RELAY_PORT` et `PC_HOST` dans le `.env` du bot correspondent",
            parse_mode="Markdown",
        )


async def cmd_shutdown(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not _guard(update):
        return

    online = _is_pc_online()
    if not online:
        await update.message.reply_text(f"❌ PC hors ligne ({PC_HOST}) — impossible d'éteindre")
        return

    await update.message.reply_text("⏳ Envoi de la commande d'arrêt…")
    ok, data = await _relay_post("/shutdown")
    if ok:
        await update.message.reply_text("✅ Commande envoyée — le PC s'éteint dans quelques secondes.")
    else:
        err = data.get("error", "inconnu")
        await update.message.reply_text(
            f"❌ Relai PC injoignable. Le PC est allumé mais le relai ne répond pas.\n\n"
            f"Erreur : *{err}*\n\n"
            f"Vérifie que `pc_relay.py` tourne sur le PC.",
            parse_mode="Markdown",
        )


async def cmd_reboot(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not _guard(update):
        return

    online = _is_pc_online()
    if not online:
        await update.message.reply_text(f"❌ PC hors ligne ({PC_HOST}) — impossible de redémarrer")
        return

    await update.message.reply_text("⏳ Envoi de la commande de redémarrage…")
    ok, data = await _relay_post("/reboot")
    if ok:
        await update.message.reply_text("✅ Commande envoyée — le PC redémarre dans quelques secondes.")
    else:
        err = data.get("error", "inconnu")
        await update.message.reply_text(
            f"❌ Relai PC injoignable.\nErreur : *{err}*",
            parse_mode="Markdown",
        )


# ─── Entrée ──────────────────────────────────────────────────────────────────
def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("help",     cmd_help))
    app.add_handler(CommandHandler("start",    cmd_help))
    app.add_handler(CommandHandler("status",   cmd_status))
    app.add_handler(CommandHandler("shutdown", cmd_shutdown))
    app.add_handler(CommandHandler("reboot",   cmd_reboot))

    log.info("Bot démarré — PC cible : %s:%d", PC_HOST, RELAY_PORT)
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
