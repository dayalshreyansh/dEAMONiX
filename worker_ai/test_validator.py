from ai.validator import DocumentValidator

validator = DocumentValidator()

fields = {
    "name": "Rahul Sharma",
    "aadhaar_number": "123456789012",
    "dob": "12/03/1998"
}

result = validator.validate(
    "AADHAAR",
    "Government of India...",
    fields
)

print(result)