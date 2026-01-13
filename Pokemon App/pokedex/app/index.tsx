import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface Pokemon {
  name: string;
  image: string;
  imageBack: string;
  shinyImage: string;
  shinyImageBack: string;
  types: PokemonTypes[];
}

interface PokemonTypes {
  type: {
    name: string;
    url: string;
  }
}

interface CaughtPokemon {
  [key: string]: {
    normal: boolean;
    shiny: boolean;
  }
}

const colorsByType: Record<string, string> = {
  grass: "#7AC74C",
  fire: "#EE8130",
  water: "#6390F0",
  flying: "#A98FF3",
  normal: "#A8A77A",
  electric: "#F7D02C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
}

const ITEMS_PER_PAGE = 20;

export default function Index() {
  const [pokemon, setPokes] = useState<Pokemon[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchResults, setSearchResults] = useState<Pokemon[]>([]);
  const [searching, setSearching] = useState(false);
  const [caughtPokemon, setCaughtPokemon] = useState<CaughtPokemon>({});
  const [showShiny, setShowShiny] = useState<{[key: string]: boolean}>({});
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showChecklist, setShowChecklist] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allPokemonNames, setAllPokemonNames] = useState<string[]>([]);

  useEffect(() => {
    fetchPoke(0);
    fetchAllPokemonNames();
  }, []);

  // Fetch all Pokémon names for search suggestions
  async function fetchAllPokemonNames() {
    try {
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10000');
      const data = await response.json();
      const names = data.results.map((p: any) => p.name);
      setAllPokemonNames(names);
    } catch (error) {
      console.log('Error fetching pokemon names:', error);
    }
  }

  // Toggle caught status 
  function toggleCaught(pokemonName: string, type: 'normal' | 'shiny') {
    setCaughtPokemon(prev => {
      const updated = {
        ...prev,
        [pokemonName]: {
          normal: prev[pokemonName]?.normal || false,
          shiny: prev[pokemonName]?.shiny || false,
          [type]: !(prev[pokemonName]?.[type] || false)
        }
      };
      return updated;
    });
  }

  // Toggle shiny display
  function toggleShiny(pokemonName: string) {
    setShowShiny(prev => ({
      ...prev,
      [pokemonName]: !prev[pokemonName]
    }));
  }

  async function searchPokemon(query: string) {
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      setSuggestions([]);
      return;
    }

    // Get suggestions from ALL Pokémon names
    const matches = allPokemonNames
      .filter(name => name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8);
    setSuggestions(matches);

    setSearching(true);
    
    // Search API for exact match
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query.toLowerCase()}`);
      
      if (response.ok) {
        const details = await response.json();
        const pokemon: Pokemon = {
          name: details.name,
          image: details.sprites.front_default,
          imageBack: details.sprites.back_default,
          shinyImage: details.sprites.front_shiny,
          shinyImageBack: details.sprites.back_shiny,
          types: details.types,
        };
        setSearchResults([pokemon]);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.log(error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    
    if (text.trim()) {
      // Show suggestions immediately from ALL Pokémon
      const matches = allPokemonNames
        .filter(name => name.toLowerCase().includes(text.toLowerCase()))
        .slice(0, 8);
      setSuggestions(matches);
    } else {
      setSearchResults([]);
      setSearching(false);
      setSuggestions([]);
    }
  };

  const selectSuggestion = (name: string) => {
    setSearchQuery(name);
    setSuggestions([]);
    searchPokemon(name);
  };

  async function fetchPoke(currentOffset: number) {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon?limit=${ITEMS_PER_PAGE}&offset=${currentOffset}`
      );
      const data = await response.json();
      
      if (data.results.length === 0) {
        setHasMore(false);
        setLoading(false);
        return;
      }
     
      const detailedPokemons = await Promise.all(
        data.results.map(async (pokemon: any) => {
          const res = await fetch(pokemon.url);
          const details = await res.json();
          return {
            name: pokemon.name,
            image: details.sprites.front_default,
            imageBack: details.sprites.back_default,
            shinyImage: details.sprites.front_shiny,
            shinyImageBack: details.sprites.back_shiny,
            types: details.types,
          };
        })
      );
      
      setPokes(prev => {
        const existingNames = new Set(prev.map(p => p.name));
        const newPokemon = detailedPokemons.filter(p => !existingNames.has(p.name));
        return [...prev, ...newPokemon];
      });
      setOffset(currentOffset + ITEMS_PER_PAGE);
      
      if (data.next === null) {
        setHasMore(false);
      }
      
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    
    if (!layoutMeasurement || !contentOffset || !contentSize) return;
    
    const paddingToBottom = 100;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isCloseToBottom && !loading && hasMore) {
      fetchPoke(offset);
    }
  };

  const displayedPokemon = searchQuery.trim() ? searchResults : pokemon;

  // Calculate stats
  const caughtNormal = Object.values(caughtPokemon).filter(p => p.normal).length;
  const caughtShiny = Object.values(caughtPokemon).filter(p => p.shiny).length;

  return (
    <View style={{ flex: 1 }}>
      {/* Toggle Checklist Button */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={() => setShowChecklist(!showChecklist)}
        >
          <Text style={styles.toggleButtonText}>
            {showChecklist ? ' Hide Checklist' : ' Show Checklist'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Pokémon by name..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={() => searchPokemon(searchQuery)}
        />
        
        {/* Search Suggestions Dropdown */}
        {suggestions.length > 0 && isSearchFocused && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionItem}
                onPress={() => selectSuggestion(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Checklist Summary - Toggle visibility */}
      {showChecklist && (
        <View style={styles.checklistSummary}>
          <Text style={styles.summaryTitle}>My Collection</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryRow}>
             
              <Text style={styles.summaryText}>{caughtNormal} Normal</Text>
            </View>
            <View style={styles.summaryRow}>
              
              <Text style={styles.summaryText}>{caughtShiny} Shiny</Text>
            </View>
          </View>
          <Text style={styles.summaryTotal}>
            Total: {caughtNormal + caughtShiny} caught
          </Text>
        </View>
      )}
      
      <ScrollView
        contentContainerStyle={{
          gap: 16,
          padding: 16,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {displayedPokemon.length > 0 ? (
          <>
            {displayedPokemon.map((pokemo) => (
              <View 
                key={pokemo.name}
                style={{
                  backgroundColor: `${colorsByType[pokemo.types[0].type.name]}30`,
                  padding: 20,
                  borderRadius: 20,
                }}
              >
                <Link 
                  href={{ pathname: "/details", params: { name: pokemo.name } }}
                  style={{ flex: 1 }}
                >
                  <View>
                    <Text style={styles.name}>{pokemo.name}</Text>
                    <View style={{ flexDirection: "row", justifyContent: "center" }}>
                      <Image
                        source={{ uri: showShiny[pokemo.name] ? pokemo.shinyImage : pokemo.image }}
                        style={{ width: 150, height: 150 }}
                      />
                    </View>
                  </View>
                </Link>

                {/* Checklist Controls */}
                <View style={styles.checklistContainer}>
                  <TouchableOpacity 
                    style={styles.shinyButton}
                    onPress={() => toggleShiny(pokemo.name)}
                  >
                    <Text style={styles.shinyButtonText}>
                      {showShiny[pokemo.name] ? 'Showing Shiny' : 'Show Shiny'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.checkboxRow}>
                    <TouchableOpacity 
                      style={styles.checkbox}
                      onPress={() => toggleCaught(pokemo.name, 'normal')}
                    >
                      <View style={[
                        styles.checkboxInner,
                        caughtPokemon[pokemo.name]?.normal && styles.checkboxChecked
                      ]}>
                        {caughtPokemon[pokemo.name]?.normal && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.checkboxLabel}>Caught Normal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.checkbox}
                      onPress={() => toggleCaught(pokemo.name, 'shiny')}
                    >
                      <View style={[
                        styles.checkboxInner,
                        caughtPokemon[pokemo.name]?.shiny && styles.checkboxCheckedShiny
                      ]}>
                        {caughtPokemon[pokemo.name]?.shiny && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.checkboxLabel}>Caught Shiny</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            
            {loading && !searchQuery && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Loading more Pokémon...</Text>
              </View>
            )}
            
            {!hasMore && !loading && !searchQuery && (
              <Text style={styles.endText}>
                You've caught 'em all! 🎉
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.noResults}>
            {searchQuery ? `No Pokémon found matching "${searchQuery}"` : "Loading..."}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 5,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  toggleButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    position: 'relative',
    zIndex: 100,
  },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: 200,
    zIndex: 1001,
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 16,
    textTransform: 'capitalize',
    color: '#333',
  },
  checklistSummary: {
    position: 'absolute',
    top: 130,
    right: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 999,
    minWidth: 140,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  summaryStats: {
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryIcon: {
    fontSize: 16,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#4CAF50',
  },
  name: {
    fontSize: 35,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  noResults: {
    textAlign: 'center',
    fontSize: 18,
    color: 'grey',
    marginTop: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: 'grey',
  },
  endText: {
    textAlign: 'center',
    fontSize: 18,
    color: 'grey',
    padding: 20,
  },
  checklistContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  shinyButton: {
    backgroundColor: '#FFD700',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  shinyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  checkboxInner: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: '#666',
    borderRadius: 6,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxCheckedShiny: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  checkmark: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
})