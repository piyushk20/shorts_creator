import os
import re
import socket
import ipaddress
import urllib.parse
from typing import Optional

# Prohibited internal hostnames
BLOCKED_HOSTNAMES = {
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "[::1]",
    "metadata.google.internal",
    "instance-data",
    "169.254.169.254"
}

def is_safe_url(url: str, resolve_dns: bool = True) -> bool:
    """
    Validates URL to protect against Server-Side Request Forgery (SSRF).
    Only permits public HTTP and HTTPS endpoints.
    Rejects private, loopback, multicast, link-local, and cloud metadata IP addresses.
    Performs DNS resolution to catch DNS rebinding and wildcard domain redirects.
    """
    if not url or not isinstance(url, str):
        return False

    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:
        return False

    if parsed.scheme not in ("http", "https"):
        return False

    hostname = (parsed.hostname or "").lower().strip()
    if not hostname:
        return False

    if hostname in BLOCKED_HOSTNAMES:
        return False

    # Check for IP address literals
    try:
        ip = ipaddress.ip_address(hostname.strip("[]"))
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved:
            return False
    except ValueError:
        # Not a raw IP literal, validate hostname format
        if hostname.endswith(".local") or hostname.endswith(".internal"):
            return False

        # If DNS resolution enabled, resolve hostname to verify resolved IPs
        if resolve_dns:
            try:
                addr_info = socket.getaddrinfo(hostname, None)
                for entry in addr_info:
                    resolved_ip_str = entry[4][0]
                    resolved_ip = ipaddress.ip_address(resolved_ip_str)
                    if resolved_ip.is_private or resolved_ip.is_loopback or resolved_ip.is_link_local or resolved_ip.is_multicast or resolved_ip.is_reserved:
                        return False
            except socket.gaierror:
                # Unresolvable hostname
                return False
            except Exception:
                return False

    return True

def sanitize_safe_id(identifier: str) -> str:
    """
    Sanitizes project or asset IDs to prevent path traversal.
    Only permits alphanumeric characters, hyphens, and underscores.
    """
    if not identifier:
        return ""
    clean = re.sub(r"[^a-zA-Z0-9_\-]", "", str(identifier))
    return clean[:64]

def escape_ffmpeg_path(path: str) -> str:
    """
    Safely escapes paths used inside FFmpeg filter complex arguments.
    Escapes colons, backslashes, and single quotes.
    """
    clean = path.replace("\\", "/").replace(":", "\\:").replace("'", "\\'")
    return clean

def escape_ffmpeg_concat_path(path: str) -> str:
    """
    Safely escapes paths for FFmpeg concat demuxer list files.
    Backslashes are converted to forward slashes and single quotes are escaped.
    """
    clean = path.replace("\\", "/").replace("'", "'\\''")
    return clean

def safe_subtitle_text(text: str) -> str:
    """
    Sanitizes text used in ASS/SRT subtitles.
    Replaces curly braces to prevent ASS style tag injection and strips internal newlines.
    """
    if not text:
        return ""
    # Neutralize ASS tag delimiters
    clean = text.replace("{", "(").replace("}", ")")
    # Normalize newlines
    clean = clean.replace("\r\n", " ").replace("\n", " ").replace("\r", " ").strip()
    return clean
