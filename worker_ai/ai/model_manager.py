from transformers import AutoTokenizer
from transformers import AutoModelForSequenceClassification


class ModelManager:

    def __init__(self):

        self.layout_tokenizer = None
        self.layout_model = None

        self.qwen_tokenizer = None
        self.qwen_model = None

    def load_layoutlm(self):

        print("Loading LayoutLM...")

        MODEL = "microsoft/layoutlmv3-base"

        self.layout_tokenizer = AutoTokenizer.from_pretrained(
            MODEL
        )

        self.layout_model = AutoModelForSequenceClassification.from_pretrained(
            MODEL
        )

        print("LayoutLM Loaded")

    def load_qwen(self):

        # We'll implement this later
        pass


models = ModelManager()