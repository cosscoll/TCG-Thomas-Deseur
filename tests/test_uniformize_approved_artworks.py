"""Test the image-processing algorithm on fake synthetic images, no original character art modified."""
import importlib.util
import pathlib
import unittest
from PIL import Image

MODULE = pathlib.Path(__file__).resolve().parents[1]/"scripts"/"uniformize-approved-artworks.py"
spec=importlib.util.spec_from_file_location("tcg_art_normalization",MODULE)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class NormalizeApprovedArtworks(unittest.TestCase):
    def test_landscape_source_has_no_crop(self):
        out,bounds=mod.normalized_canvas(Image.new("RGB",(450,150),(255,0,0)),(300,400))
        self.assertEqual(out.size,(300,400))
        self.assertEqual(bounds,[0,150,300,100])
        self.assertEqual(out.getpixel((150,200)),(255,0,0))

    def test_extremely_wide_source_has_no_crop(self):
        _,bounds=mod.normalized_canvas(Image.new("RGB",(1000,100)),(300,400))
        self.assertEqual(bounds,[0,185,300,30])

    def test_tall_source_has_no_crop(self):
        out,bounds=mod.normalized_canvas(Image.new("RGB",(150,450),(0,255,0)),(300,400))
        self.assertEqual(out.size,(300,400))
        self.assertEqual(bounds,[83,0,133,400])
        self.assertEqual(out.getpixel((150,200)),(0,255,0))

    def test_square_source_has_no_crop(self):
        out,bounds=mod.normalized_canvas(Image.new("RGB",(320,320),(0,40,250)),(300,400))
        self.assertEqual(bounds,[0,50,300,300])
        self.assertEqual(out.getpixel((150,200)),(0,40,250))

    def test_wrong_catalogue_is_rejected(self):
        with self.assertRaises((KeyError,ValueError)):
            mod.approved_assets({"schema":"invalid","cards":[]})

if __name__=="__main__":
    unittest.main()
