import sys
from pathlib import Path

ROOT = Path(__file__).parent.resolve()

paths_to_add = [
    ROOT,
    ROOT / "doctor",
    ROOT / "extraction",
]

for path in paths_to_add:
    path_str = str(path)
    if path_str not in sys.path:
        sys.path.insert(0, path_str)

# Ensure full module identity alignment across doctor and extraction
import doctor.knowledge_engine as _ke
import doctor.medical_reference as _mr
import doctor.interpretation as _interp
import extraction.vision as _vis
import extraction.ui_uploads as _uup

sys.modules["knowledge_engine"] = _ke
sys.modules["medical_reference"] = _mr
sys.modules["interpretation"] = _interp
sys.modules["vision"] = _vis
sys.modules["ui_uploads"] = _uup

# Alias all submodules dynamically
for key, module in list(sys.modules.items()):
    if key.startswith("doctor.knowledge_engine"):
        sys.modules[key.replace("doctor.", "", 1)] = module
    elif key.startswith("doctor.medical_reference"):
        sys.modules[key.replace("doctor.", "", 1)] = module
    elif key.startswith("doctor.interpretation"):
        sys.modules[key.replace("doctor.", "", 1)] = module
    elif key.startswith("extraction.vision"):
        sys.modules[key.replace("extraction.", "", 1)] = module


