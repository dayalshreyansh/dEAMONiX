# AI Underwriting Engine – dEAMONiX

An AI-assisted document verification and analysis system designed to streamline financial document processing through computer vision, OCR, rule-based validation, and Large Language Models (LLMs).

## Overview

Financial document verification often involves manually examining documents, extracting relevant information, checking consistency, and identifying potential anomalies.

**dEAMONiX** aims to simplify this workflow through an automated document-processing pipeline that combines traditional image-processing techniques with AI-powered analysis.

The system processes uploaded documents, extracts textual information, performs structured validation checks, and generates analysis to assist human reviewers.

It is designed as a decision-support system, keeping human review in the verification workflow rather than treating automated outputs as definitive proof of document authenticity.

## Key Features

- **Document Processing:** Accepts uploaded financial and identity documents for analysis.
- **OCR-Based Text Extraction:** Extracts document information using EasyOCR.
- **Image Processing:** Uses OpenCV for image analysis and preprocessing.
- **PDF Processing:** Extracts and processes PDF content using PyMuPDF.
- **Rule-Based Validation:** Implements structured checks for document information, including Aadhaar Verhoeff checksum validation, PAN-related checks, and numerical consistency checks.
- **AI-Assisted Analysis:** Integrates Google's Gemini 2.5 Flash model for contextual document analysis.
- **Image Anomaly Analysis:** Uses Error Level Analysis (ELA) as an image-analysis technique to examine potential inconsistencies.
- **Asynchronous Processing:** Processes document-verification tasks using Redis-based task queues.
- **Real-Time Updates:** Uses Redis Pub/Sub and WebSockets to communicate processing updates.
- **Human-in-the-Loop Workflow:** Supports human review of generated findings before verification decisions are made.

## Technology Stack

| Component | Technology |
|---|---|
| Backend | Node.js |
| AI Processing | Python |
| AI Model | Google Gemini 2.5 Flash |
| OCR | EasyOCR |
| Image Processing | OpenCV |
| PDF Processing | PyMuPDF |
| Task Queue | Redis |
| Real-Time Communication | Redis Pub/Sub, WebSockets |
| Database | PostgreSQL |
| Object Storage | MinIO |
| Infrastructure | Docker |

## System Architecture

The application follows an asynchronous client-server architecture in which document processing is separated from the primary backend.

### Processing Pipeline

1. **Document Upload:** Users upload documents through the application.
2. **Secure Storage:** Documents are stored in MinIO object storage.
3. **Task Creation:** The Node.js backend creates a processing task and pushes it into the Redis `forensic_tasks` queue.
4. **AI Worker:** A Python worker retrieves tasks using Redis BLPOP.
5. **Document Analysis:** The worker processes documents using PDF extraction, OCR, image processing, and rule-based validation.
6. **AI-Assisted Interpretation:** Gemini 2.5 Flash is used for contextual analysis of extracted information.
7. **Result Communication:** Processing updates are published through Redis Pub/Sub using the `finguard_updates` channel and communicated to connected clients through WebSockets.
8. **Human Review:** Generated findings are made available for review and further verification.

### Architecture Overview

```text
          Client Application
                  |
                  v
           Node.js Backend
                  |
          +-------+-------+
          |               |
          v               v
      PostgreSQL        MinIO
          |           Document Storage
          |               |
          |               v
          |         Redis Task Queue
          |         forensic_tasks
          |               |
          |               v
          |          Python Worker
          |               |
          |      +--------+--------+
          |      |        |        |
          |     OCR    OpenCV   PyMuPDF
          |      |        |        |
          |      +--------+--------+
          |               |
          |         Gemini API
          |               |
          |               v
          |       Validation Results
          |               |
          +---------------+
                          |
                          v
                    Redis Pub/Sub
                   finguard_updates
                          |
                          v
                     WebSockets
                          |
                          v
                   Client Updates
                          |
                          v
                     Human Review
```

## Core Technical Implementations

### 1. Document Extraction

The Python processing worker uses:

- PyMuPDF for PDF text extraction and document handling.
- EasyOCR for extracting text from document images.
- OpenCV for image preprocessing and analysis.

This combination allows the system to handle both text-based PDFs and image-based documents.

### 2. Rule-Based Validation

The system implements structured validation mechanisms to check extracted information.

Examples include:

- Aadhaar number checksum validation using the Verhoeff algorithm.
- PAN-related format and consistency checks.
- Arithmetic validation of extracted numerical information.
- Cross-checking extracted fields where applicable.

These checks help identify inconsistencies but do not independently establish whether a document is genuine.

### 3. Image Analysis

OpenCV-based image analysis, including Error Level Analysis (ELA), is incorporated to examine potential image inconsistencies.

These techniques are intended to provide additional signals for review and should not be treated as conclusive evidence of tampering.

### 4. LLM Integration

Google Gemini 2.5 Flash is integrated to assist with contextual analysis of extracted document information.

The model helps interpret document content and produce structured findings that complement conventional validation techniques.

### 5. Asynchronous Task Processing

A separate Python worker handles computationally intensive document-processing tasks.

Redis is used for:

- Task distribution through the `forensic_tasks` queue.
- Blocking task retrieval through BLPOP.
- Publishing processing updates through Redis Pub/Sub.

This separation prevents document analysis from unnecessarily blocking the primary backend request-response cycle.

### 6. Real-Time Communication

Redis Pub/Sub and WebSockets are used to communicate task progress and processing updates to connected clients.

### 7. Object Storage

MinIO is used to store uploaded documents in the `finguard-documents` bucket.

The backend generates time-limited signed URLs for controlled document access.

## Getting Started

### Prerequisites

- Node.js
- Python 3
- npm
- Docker and Docker Compose
- PostgreSQL
- Redis

### Installation

Clone the repository:

```bash
git clone https://github.com/dayalshreyansh/dEAMONiX/new/main?filename=README.md
cd dEAMONiX
```

Install backend dependencies:

```bash
npm install
```

Set up the Python environment:

```bash
python -m venv venv
```

Activate the environment:

```bash
# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Configure the required environment variables for the backend, Python worker, database, Redis, MinIO, and Gemini API.

Start the infrastructure using the project's Docker configuration and run the database migrations and application services using the commands defined in the repository.

*Note: Installation commands and environment configuration should be adjusted to match the actual repository structure.*

## Project Objectives

- Explore the practical application of AI in financial document processing.
- Combine traditional computer vision with LLM-based analysis.
- Design asynchronous processing architectures using Redis.
- Implement structured document extraction and validation.
- Build real-time communication between distributed application components.
- Explore human-in-the-loop approaches to AI-assisted verification.

## Acknowledgements and References

This project uses and builds upon several open-source technologies and external services:

- [OpenCV](https://opencv.org/) – Computer vision and image processing.
- [PyMuPDF](https://pymupdf.readthedocs.io/) – PDF processing and extraction.
- [EasyOCR](https://github.com/JaidedAI/EasyOCR) – Optical character recognition.
- [Redis](https://redis.io/) – Task queues and message publishing.
- [MinIO](https://min.io/) – Object storage.
- [PostgreSQL](https://www.postgresql.org/) – Relational database.
- [Google Gemini API](https://ai.google.dev/gemini-api/docs) – AI-assisted document analysis.

All referenced technologies, libraries, and services remain the property of their respective owners and are used in accordance with their applicable licenses and terms.

## Disclaimer

dEAMONiX is an independently developed AI-assisted document analysis project.

It is intended for educational, research, and demonstration purposes. Automated outputs, OCR results, image-analysis signals, and AI-generated findings are not definitive proof of document authenticity.

The system is designed to assist human reviewers and should not be treated as a replacement for official verification procedures, regulatory checks, or professional underwriting decisions.

---

**Developed as an independent AI and software engineering project.**
