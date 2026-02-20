import axios from "axios";
import { create } from "zustand";
import toast from "react-hot-toast";
const BASE_URL = "http://localhost:3000";
export const useProductStore = create((set, get) =>({
    products:[],
    loading:false,
    error:null,
    currentProduct: null,
    // pagination / search meta
    total: 0,
    page: 1,
    pageSize: 20,
    suggestions: [],
    searchHistory: [],
    autocompleteResults: [],

    // form state
    formData: {
        name: "",
        price: "",
        image: "",
    },

    setFormData: (formData) => set({ formData }),
    resetForm: () => set({ formData: { name: "", price: "", image: "" } }),

    addProduct: async (e) => {
        e.preventDefault();
        set({ loading: true });

        try {
        const { formData } = get();
        await axios.post(`${BASE_URL}/api/products`, formData);
        await get().fetchProducts();
        get().resetForm();
        toast.success("Product added successfully");
        document.getElementById("add_product_modal").close();
        } catch (error) {
        console.log("Error in addProduct function", error);
        toast.error("Something went wrong");
        } finally {
        set({ loading: false });
        }
    },


    fetchProducts: async ()=>{
        set({loading: true});
        try{
            const res = await axios.get(`${BASE_URL}/api/products`);
            set({products: res.data.data, error:null})
        }catch(err){
            if(err.status == 429)set({error: "Rate limit exceeded", products:[]});
            else set({error: "Smth went brrr", products:[]});
        }finally{
            set({loading: false});
        }
    },
    searchProducts: async (query, filters = {}, page = 1) => {
        set({ loading: true });
        try {
            const params = { q: query, page, limit: get().pageSize, ...filters };
            const res = await axios.get(`${BASE_URL}/api/products/search`, { params });
            const { data, meta } = res.data;
            set({ products: data || [], error: null, total: meta?.total || 0, page: meta?.page || page });
        } catch (err) {
            console.log("Error in searchProducts", err);
            set({ error: "Search failed", products: [], total: 0 });
        } finally {
            set({ loading: false });
        }
    },
    searchAutocomplete: async (query) => {
        if (!query || query.length < 1) {
            set({ suggestions: [] });
            return;
        }
        try {
            const res = await axios.get(`${BASE_URL}/api/products/search/autocomplete`, { params: { q: query } });
            set({ suggestions: res.data.data || [] });
        } catch (err) {
            console.log("autocomplete error", err);
            set({ suggestions: [] });
        }
    },
    fetchSearchSuggestions: async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/products/search/suggestions`);
            set({ searchHistory: res.data.data || [] });
        } catch (err) {
            console.log("Error fetching suggestions", err);
            set({ searchHistory: [] });
        }
    },
    fetchAutocomplete: async (query) => {
        if (!query || query.length < 1) {
            set({ autocompleteResults: [] });
            return;
        }
        try {
            const res = await axios.get(`${BASE_URL}/api/products/search/autocomplete`, { params: { q: query } });
            set({ autocompleteResults: res.data.data || [] });
        } catch (err) {
            console.log("Error fetching autocomplete", err);
            set({ autocompleteResults: [] });
        }
    },
    // (duplicate removed) use `searchProducts(query, filters, page)` above
    deleteProduct: async (id) => {
        console.log("deleteProduct function called", id);
        set({ loading: true });
        try {
            await axios.delete(`${BASE_URL}/api/products/${id}`);
            set((prev) => ({ products: prev.products.filter((product) => product.id !== id) }));
            toast.success("Product deleted successfully");
        } catch (error) {
            console.log("Error in deleteProduct function", error);
            toast.error("Something went wrong");
        } finally {
            set({ loading: false });
        }
    },

    fetchProduct: async (id) => {
        set({ loading: true });
        try {
        const response = await axios.get(`${BASE_URL}/api/products/${id}`);
        set({
            currentProduct: response.data.data,
            formData: response.data.data, // pre-fill form with current product data
            error: null,
        });
        } catch (error) {
        console.log("Error in fetchProduct function", error);
        set({ error: "Something went wrong", currentProduct: null });
        } finally {
        set({ loading: false });
        }
    },
    updateProduct: async (id) => {
    set({ loading: true });
    try {
      const { formData } = get();
      const response = await axios.put(`${BASE_URL}/api/products/${id}`, formData);
      set({ currentProduct: response.data.data });
      toast.success("Product updated successfully");
    } catch (error) {
      toast.error("Something went wrong");
      console.log("Error in updateProduct function", error);
    } finally {
      set({ loading: false });
    }
  },
})
);