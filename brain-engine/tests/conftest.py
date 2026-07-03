import os
import sys

# Inject the parent root directory into sys.path to enable direct namespace imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
