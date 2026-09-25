FROM python:3.11-slim

# 1. Hugging Face Spaces requires running as non-root user (UID 1000)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1

WORKDIR $HOME/app

# 2. Install dependencies into user directory
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --user --upgrade pip && \
    pip install --no-cache-dir --user -r requirements.txt

# 3. Copy application code with user ownership
COPY --chown=user . .

# 4. Ensure writable data directory
RUN mkdir -p $HOME/app/data

EXPOSE 7860

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
