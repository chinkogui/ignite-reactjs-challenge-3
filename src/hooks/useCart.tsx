import { createContext, ReactNode, useContext, useState } from 'react';
import { api } from '../services/api';
import { showMessageError, showMessageSuccess } from '../util/helpers';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // Primeiro verificar se o item existe no carrinho
      const productAlreadyInCart = cart.find(item => item.id === productId);
      if (productAlreadyInCart) {
        // Se existir manda pra função updateProductAmount
        await updateProductAmount({ productId, amount: productAlreadyInCart.amount + 1 });
        return;
      }

      // Verificar o estoque do produto
      const stock: Stock = await api.get(`stock/${productId}`)
      .then(response => {
        return response.data;
      })
      .catch(() => {
        throw new Error('Erro na adição do produto');
      })

      if (stock.amount === 0) throw new Error('Quantidade solicitada fora de estoque');
      
      // Se tiver estoque adiciona o produto
      const product: Product = await api.get(`products/${productId}`)
      .then(response => {
        return response.data
      })
      .catch(() => {
        throw new Error('Erro na adição do produto');
      })

      const updatedCart = [
        ...cart,
        { ...product, amount: 1 }
      ];

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      showMessageSuccess('Item adicionado com sucesso');
    } catch (error: any) {
      showMessageError(error.message);
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // Verifica se o item existe no carrinho
      const productExistInCart = cart.some(product => product.id === productId);

      // Caso não, estoura uma excessão
      if(!productExistInCart) throw new Error('Erro na remoção do produto');

      // Caso sim, filtro o carrinho
      const filteredCart = cart.filter(product => product.id !== productId);
      
      setCart(filteredCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredCart));
      showMessageSuccess('Item removido com sucesso');
    } catch (error: any) {
      showMessageError(error.message);
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // Se a quantidade for menor que 1
      if(amount < 1) return;

      // Verifica se o item existe no carrinho
      const productExistInCart = cart.some(product => product.id === productId);

      // Caso não, estoura uma excessão
      if(!productExistInCart) throw new Error('Erro na alteração de quantidade do produto');

      // Verificar o estoque do produto
      const stock: Stock = await api.get(`stock/${productId}`)
      .then(response => {        
        return response.data
      })
      .catch(() => {
        throw new Error('Erro na adição do produto');
      })

      if (stock.amount < amount) throw new Error('Quantidade solicitada fora de estoque');

      // Descobrir a index do produto dentro do carrinho
      const productIndex = cart.findIndex(item => item.id === productId);

      // Fazendo uma cópia do carrinho e atualizando o amount
      const tempCart = [...cart];
      
      tempCart[productIndex].amount = amount;
      setCart(tempCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(tempCart));
      showMessageSuccess('Quantidade atualizada com sucesso');
    } catch (error: any) {
      showMessageError(error.message);
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
