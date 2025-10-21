
# SkillSwap Implementation TODO

## Smart Contract Updates
- [x] Redesign `contract.py` to include global state for users, skills, sessions, and token balances using ASA for skill hour tokens.
- [x] Implement methods: `register_user`, `list_skill`, `book_session`, `complete_session`, `transfer_tokens`, `get_reputation`.
- [x] Add trustless agreement logic (e.g., escrow for sessions).

## Frontend Updates
- [x] Update `Home.tsx` to a SkillSwap dashboard with user profile, available skills, and actions.
- [x] Update `AppCalls.tsx` to handle new contract methods (forms for listing skills, booking).
- [x] Create new component `SkillList.tsx` for displaying available skills.
- [x] Create new component `UserProfile.tsx` for user profile and reputation.
- [x] Create new component `BookingModal.tsx` for booking sessions.

## Testing and Deployment
- [x] Deploy and test the smart contract on localnet.
- [x] Run the frontend, connect wallet, and test skill listing/booking functionality.
- [x] Ensure no new dependencies; use existing AlgoKit tools.
