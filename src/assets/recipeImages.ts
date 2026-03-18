/**
 * Static mapping for preset recipe images
 * @format
 */

export const RecipeImages: { [key: string]: any } = {
  // Use the 'image_key' from your JSON as the property name
  "tomato_pasta": require('./recipes/tomato_pasta.jpg'),
  "beef_broccoli": require('./recipes/beef_broccoli.jpg'),
  "chicken_curry": require('./recipes/chicken_curry.jpg'),

  "stir_fried_oil_gluten": require('./recipes/stir_fried_oil_gluten.jpg'),
  "stuffed_mushrooms_shrimp": require('./recipes/stuffed_mushrooms_shrimp.jpg'),
  "yuxiang_shredded_pork": require('./recipes/yuxiang_shredded_pork.jpg'),
  "stir_fried_chicken_onion": require('./recipes/stir_fried_chicken_onion.jpg'),
  "sour_spicy_chicken_giblets": require('./recipes/sour_spicy_chicken_giblets.jpg'),

  "braised_pork_quail_eggs": require('./recipes/braised_pork_quail_eggs.jpg'),
  "malatang": require('./recipes/malatang.jpg'),
  "wenling_fried_rice_noodles": require('./recipes/wenling_fried_rice_noodles.jpg'),
  
  // Add a default placeholder for any missing keys
  "placeholder": require('./Icons/cookbook.png'), 
};