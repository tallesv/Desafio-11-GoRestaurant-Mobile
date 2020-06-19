import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  category: number;
  image_url: string;
  thumbnail_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      api.get(`foods/${routeParams.id}`).then(response => {
        const apiFood = response.data;
        setFood(apiFood);
        setExtras(apiFood.extras);
        api.get(`favorites`).then(favoritesResponse => {
          const favorites = favoritesResponse.data;
          setIsFavorite(
            !!favorites.find(favorite => favorite.id === apiFood.id),
          );
        });
      });
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    const findExtra = extras.find(extra => extra.id === id);

    if (findExtra) {
      findExtra.quantity = findExtra.quantity ? findExtra.quantity + 1 : 1;

      const extrasUpdate = extras.map(extra =>
        extra.id === id ? findExtra : extra,
      );

      setExtras(extrasUpdate);
    } else {
      throw new Error('extra not find.');
    }
  }

  function handleDecrementExtra(id: number): void {
    const findExtra = extras.find(extra => extra.id === id);

    if (findExtra) {
      findExtra.quantity =
        findExtra.quantity && findExtra.quantity > 1
          ? findExtra.quantity - 1
          : 0;

      const extrasUpdate = extras.map(extra =>
        extra.id === id ? findExtra : extra,
      );

      setExtras(extrasUpdate);
    } else {
      throw new Error('extra not find.');
    }
  }

  function handleIncrementFood(): void {
    setFoodQuantity(foodQuantity > 0 ? foodQuantity + 1 : 1);
  }

  function handleDecrementFood(): void {
    setFoodQuantity(foodQuantity > 1 ? foodQuantity - 1 : 1);
  }

  const toggleFavorite = useCallback(() => {
    if (isFavorite) {
      setIsFavorite(false);
      api.delete(`favorites/${food.id}`);
    } else {
      setIsFavorite(true);
      const {
        id,
        name,
        description,
        price,
        category,
        image_url,
        thumbnail_url,
      } = food;
      api.post('favorites', {
        id,
        name,
        description,
        price,
        category,
        image_url,
        thumbnail_url,
      });
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const extraValues = extras.map(extra =>
      extra.quantity || extra.quantity > 0 ? extra.value * extra.quantity : 0,
    );
    const totalExtraValues = extraValues.reduce(
      (previousValue, currentValue) => previousValue + currentValue,
      0,
    );

    return food.price * foodQuantity + totalExtraValues;
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    const { id, name, description, price, category, thumbnail_url } = food;
    const getExtras = extras.map(extra => (extra.quantity > 0 ? extra : null));
    api.post('orders', {
      product_id: id,
      name,
      description,
      price,
      category,
      thumbnail_url,
      extras: getExtras,
    });
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{formatValue(food.price)}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity || extra.quantity > 1
                    ? extra.quantity
                    : undefined}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">
              {formatValue(cartTotal)}
            </TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
