 # Feature: AI Game Analysis with LLM                                                                                                        
                                                                                                                                              
## Summary                                                                                                                                  
Use a large language model (LLM) to chat about chess games based on Stockfish evaluations and move classifications.                         
                                                                                                                                        
                                                                                                                                        
## User Story                                                                                                                               
As a chess player, I want to discuss my game with an AI assistant and expect it to be consistent with analysis is baed on accurate engine evaluations.

## Trigger
<!-- When/how does the LLM analysis start? -->
- [x] On demand via a button in the analysis panel

## LLM Context
Context should be gathered in multiple phases.

- [ ] Gather per-move data :
    - [ ] For every move, send a separate request with current position and engine's evaluation. 
    - [ ] Prompt LLM to provide concise analysis of the position.
    - [ ] For blunders and mistakes, ask to consider alternative lines.        
- [ ] Combine move analysis into a single Game Context.

## Chat with LLM
- [ ] Start chat with LLM by providing gamer context and prompt to provide short game overview.
- [ ] After that user can ask specific questions about the game.

## UI Placement
<!-- Where does the output appear? -->
- [ ] New tab in the analysis panel (alongside Classification / Analysis / Graph tabs)

## LLM Provider
Do not let user to pick the model just yet, it will be done in next itarations.

- [x] OpenAI (GPT-4o, etc.)
- [x] Anthropic (Claude)
- [x] DeepSeek

## API Key Handling
<!-- This app is fully client-side (static export) -->
- [x] User enters their own API key in settings (stored in localStorage)
- [x] Support for multiple providers with user-entered keys

## Logging
- [ ] Log Game Context to console after it gathered

## Constraints / Notes
<!-- Cost concerns, streaming vs batch, caching, rate limiting, etc. -->