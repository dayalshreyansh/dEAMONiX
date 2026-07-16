from ai.classifier import DocumentClassifier

classifier = DocumentClassifier()

text = """
Government of India
Unique Identification Authority of India

Name: Rahul Sharma

DOB: 12/03/1998

Gender: Male

1234 5678 9012
"""

result = classifier.classify(text)

print(result)