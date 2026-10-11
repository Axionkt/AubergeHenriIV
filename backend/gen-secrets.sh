#!/usr/bin/env bash
echo "JWT_ACCESS_SECRET=$(openssl rand -hex 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"