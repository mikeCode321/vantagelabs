# logger.py
import logging
import sys
from config.settings import ENV, LOG_FILE

# Base logger configuration
_base_logger = logging.getLogger("practicevantagelabs")
_base_logger.setLevel(logging.DEBUG if ENV == "development" else logging.INFO)
_base_logger.propagate = False  # prevent logs from also going to root logger

formatter = logging.Formatter("[Location: %(location)s] - %(levelname)s - %(message)s")

# Avoid adding multiple handlers if this file is imported multiple times
if not _base_logger.handlers:
    if LOG_FILE:
        file_handler = logging.FileHandler(LOG_FILE)
        file_handler.setLevel(logging.DEBUG if ENV == "development" else logging.INFO)
        file_handler.setFormatter(formatter)
        _base_logger.addHandler(file_handler)
    else:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG if ENV == "development" else logging.INFO)
        console_handler.setFormatter(formatter)
        _base_logger.addHandler(console_handler)

# Wrapper class to include location automatically
class Logger:
    def __init__(self, location: str = "default"):
        self._logger = _base_logger
        self._location = location

    def info(self, msg, **kwargs):
        self._logger.info(msg, extra={"location": self._location}, **kwargs)

    def warning(self, msg, **kwargs):
        self._logger.warning(msg, extra={"location": self._location}, **kwargs)

    def error(self, msg, **kwargs):
        self._logger.error(msg, extra={"location": self._location}, **kwargs)

    def debug(self, msg, **kwargs):
        self._logger.debug(msg, extra={"location": self._location}, **kwargs)