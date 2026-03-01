import express from "express"
import { createProduct, deleteProduct, getAllProducts, getProduct, updateProduct, searchProducts, searchSuggestions, autocomplete } from "../controllers/productController.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/search/suggestions", searchSuggestions);
router.get("/search/autocomplete", autocomplete);
router.get("/search", searchProducts);
router.get("/:id", getProduct);
router.post("/", createProduct);
router.put("/:id", updateProduct);      
router.delete("/:id", deleteProduct);   

export default router;
