# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Install necessary system dependencies for processing PDFs, images, and performing OCR
RUN apt-get update && apt-get install -y \
    libsm6 \
    libxext6 \
    libgl1-mesa-glx \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    libopenjp2-7-dev \
    poppler-utils \
    tesseract-ocr \
    libtesseract-dev && \
    apt-get clean

# Copy the requirements file and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the necessary ports
EXPOSE 8080/tcp
EXPOSE 8080/udp

# Health check to ensure the container is running correctly
HEALTHCHECK --interval=30s --timeout=30s --retries=3 CMD curl --fail http://localhost:8080/ || exit 1

# Start Gunicorn server with fewer workers to reduce memory usage
CMD ["gunicorn", "server:app", "--bind", "0.0.0.0:8080", "--workers", "1", "--timeout", "4000"]
