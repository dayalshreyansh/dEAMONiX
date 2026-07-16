from ai.extractor import DocumentExtractor

extractor = DocumentExtractor()

text = """
Government of India
Unique Identification Authority of India

Name: Rahul Sharma

DOB: 12/03/1998

Gender: Male

1234 5678 9012
"""

result = extractor.extract(
    "AADHAAR",
    text
)

print(result)