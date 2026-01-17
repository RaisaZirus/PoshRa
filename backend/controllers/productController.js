import { sql } from "../config/db.js";
//CRUD
export const getAllProducts = async (req, res)=>{
    try{
        const products = await sql`
            SELECT * FROM products
            ORDER BY created_at DESC
        `;
        console.log("fetched products", products);
        res.status(200).json({success: true, data: products});
    }catch(error){
        console.log("Error in getAllProducts func", error);
        res.status(500).json({success : false, message :"Internal server error"})
    }
};
export const createProduct = async (req, res)=>{
    const {name, price, image} = req.body
    if(!name || !price || !image){
        return res.status(400).json({success: true, message: "All field koi?"});
    }

    try{
        const new_product = await sql`
            INSERT INTO products (name, price, image)
            VALUES (${name}, ${price}, ${image})
            RETURNING *
        `;
        console.log("new product added: ", new_product);
        //postman test 
        res.status(201).json({success: true, data: new_product[0]});
    }catch(error){
        console.log("Error in createProducts func", error);
        res.status(500).json({success : false, message :"Internal server error"})
    }
};
export const getProduct = async (req, res)=>{
    const {id} = req.params; 
    try{
        const product = await sql`
            SELECT * FROM products WHERE id=${id}
        `;
        res.status(500).json({success: true, data: product[0]});
    }catch(error){
        console.log("Error in getProduct func", error);
        res.status(500).json({success : false, message :"Internal server error"})
    }
};
export const updateProduct = async (req, res)=>{
    const {id} = req.params
    const {name, price , image}= req.body;

    try{
        const updatedprod =  await sql`
            UPDATE products 
            SET name = ${name}, price=${price}, image=${image}
            WHERE id = ${id}
            RETURNING *
        `;
        if(updatedprod.length === 0){
            //not found 
            return res.status(404).json({success : false, message :"Product not found"})
        }
        res.status(200).json({success : true, data: updatedprod[0]});
    }catch(error){
        console.log("Error in updateProduct func", error);
        res.status(500).json({success : false, message :"Internal server error"});
    }
};
export const deleteProduct = async (req, res)=>{
    const {id} = req.params;

    try{
        const deletedprod = await sql`
            DELETE FROM products WHERE id=${id}
            RETURNING *
        `;
        if(deletedprod.length===0){
            //delete hoy nai karon product paay nai
            return res.status(404).json({success : false, message :"Product not found"})
        }
        res.status(200).json({success: true, data: deletedprod[0]});
    }catch(error){
        console.log("Error in deleteProduct func", error);
        res.status(500).json({success : false, message :"Internal server error"});
    }
};