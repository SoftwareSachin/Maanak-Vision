import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface TrainedProduct {
  id: string;
  name: string;
  shots: string[];
  createdAt: number;
  active: boolean;
}

interface TrainingContextType {
  products: TrainedProduct[];
  activeProduct: TrainedProduct | null;
  addProduct: (product: TrainedProduct) => void;
  setActiveProduct: (id: string) => void;
  deleteProduct: (id: string) => void;
}

const TrainingContext = createContext<TrainingContextType | null>(null);

const STORAGE_KEY = "@maanak_products";

export function TrainingProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<TrainedProduct[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setProducts(JSON.parse(stored));
      } catch {}
    })();
  }, []);

  const persist = useCallback(async (data: TrainedProduct[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, []);

  const addProduct = useCallback(
    (product: TrainedProduct) => {
      const updated = [product, ...products];
      setProducts(updated);
      persist(updated);
    },
    [products, persist]
  );

  const setActiveProduct = useCallback(
    (id: string) => {
      const updated = products.map((p) => ({ ...p, active: p.id === id }));
      setProducts(updated);
      persist(updated);
    },
    [products, persist]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      persist(updated);
    },
    [products, persist]
  );

  const activeProduct = products.find((p) => p.active) ?? null;

  return (
    <TrainingContext.Provider
      value={{ products, activeProduct, addProduct, setActiveProduct, deleteProduct }}
    >
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining() {
  const ctx = useContext(TrainingContext);
  if (!ctx) throw new Error("useTraining must be used within TrainingProvider");
  return ctx;
}
