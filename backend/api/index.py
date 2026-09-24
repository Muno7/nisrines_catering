"""Vercel serverless entrypoint for the Flask application.

Vercel discovers Python functions from the ``api/`` directory.  The existing
application factory and production configuration remain in ``run.py``; this
module only exposes its WSGI app under Vercel's expected name.
"""

from run import app

