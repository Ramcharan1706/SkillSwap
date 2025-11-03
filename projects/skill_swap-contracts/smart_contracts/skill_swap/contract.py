from algopy import ARC4Contract, String, UInt64, Global, Txn, Asset, Address
from algopy.arc4 import abimethod, Struct
from algopy import GlobalState
from algopy.itxn import AssetConfig, AssetTransfer


class User(Struct):
    name: String
    reputation: UInt64
    token_balance: UInt64  # tracked internally, optional
    learner_nfts: UInt64  # number of NFTs earned as learner
    nft_asset_ids: String  # comma-separated list of NFT asset IDs owned by user
    available_nfts: String  # comma-separated list of NFT IDs available for claiming


class Skill(Struct):
    teacher: Address
    receiver: Address
    name: String
    description: String
    hourly_rate: UInt64  # in skill tokens
    available: bool


class Session(Struct):
    student: Address
    teacher: Address
    skill_id: UInt64
    hours: UInt64
    status: String  # "booked", "completed", "cancelled"
    escrow_amount: UInt64


class SkillSwap(ARC4Contract):
    # Global state
    users: GlobalState
    skills: GlobalState
    sessions: GlobalState
    skill_token_id: UInt64  # ASA ID for skill tokens
    next_skill_id: UInt64
    next_session_id: UInt64

    @abimethod()
    def __init__(self) -> None:
        self.next_skill_id = UInt64(1)
        self.next_session_id = UInt64(1)

    @abimethod()
    def set_skill_token(self, token_id: UInt64) -> None:
        assert Txn.sender == Global.creator_address, "Only creator can set token"
        self.skill_token_id = token_id

    @abimethod()
    def register_user(self, name: String) -> None:
        assert Txn.sender not in self.users, "User already registered"
        user = User(name=name, reputation=UInt64(0), token_balance=UInt64(0), learner_nfts=UInt64(0), nft_asset_ids=String(""), available_nfts=String(""))
        self.users[Txn.sender] = user

    @abimethod()
    def list_skill(self, receiver: Address, name: String, description: String, hourly_rate: UInt64) -> UInt64:
        assert Txn.sender in self.users, "User must register first"
        skill_id = self.next_skill_id
        skill = Skill(
            teacher=Txn.sender,
            receiver=receiver,
            name=name,
            description=description,
            hourly_rate=hourly_rate,
            available=True
        )
        self.skills[skill_id] = skill
        self.next_skill_id += 1
        return skill_id

    @abimethod()
    def book_session(self, skill_id: UInt64, hours: UInt64) -> UInt64:
        assert skill_id in self.skills, "Skill does not exist"
        skill = self.skills[skill_id]
        assert skill.available, "Skill not available"
        cost = skill.hourly_rate * hours

        # Verify ASA opt-in & sufficient balance, then transfer ASA tokens to escrow (contract)
        # Note: In Algopy / ARC4 this is a simplified placeholder,
        # you need to implement the ASA transfer logic with inner transactions or group transactions in real Algorand PyTeal

        # Here, you would require an ASA transfer from student to contract address
        # This contract assumes the transfer is done *outside* or by grouping transactions

        session_id = self.next_session_id
        session = Session(
            student=Txn.sender,
            teacher=skill.teacher,
            skill_id=skill_id,
            hours=hours,
            status=String("booked"),
            escrow_amount=cost
        )
        self.sessions[session_id] = session
        self.next_session_id += 1
        return session_id

    @abimethod()
    def complete_session(self, session_id: UInt64) -> None:
        assert session_id in self.sessions, "Session does not exist"
        session = self.sessions[session_id]
        assert Txn.sender == session.teacher, "Only teacher can complete session"
        assert session.status == String("booked"), "Session not in booked state"

        # Transfer ASA tokens from escrow (contract) to teacher
        # Again, implement ASA transfer inner transactions here or handle externally

        # Update reputation of teacher
        teacher_user = self.users[session.teacher]
        teacher_user.reputation += session.hours
        self.users[session.teacher] = teacher_user

        session.status = String("completed")
        self.sessions[session_id] = session

    @abimethod()
    def award_nft_to_student(self, session_id: UInt64) -> UInt64:
        assert session_id in self.sessions, "Session does not exist"
        session = self.sessions[session_id]
        assert Txn.sender == session.teacher, "Only teacher can award NFT for their session"
        assert session.status == String("completed"), "Session must be completed first"

        # Create a unique NFT ASA for the student
        nft_name = String(f"SkillSwap Session {session_id}")
        nft_unit_name = String(f"SS{str(session_id)}")
        nft_url = String(f"https://skillswap.com/nft/{session_id}")

        # Create NFT asset with total supply of 1 (non-fungible)
        create_txn = AssetConfig(
            sender=Global.current_application_address,
            total=UInt64(1),
            decimals=UInt64(0),
            default_frozen=False,
            unit_name=nft_unit_name,
            asset_name=nft_name,
            url=nft_url,
            manager=Global.current_application_address,
            reserve=Global.current_application_address,
            freeze=Global.current_application_address,
            clawback=Global.current_application_address
        )
        nft_asset_id = create_txn.submit().asset_id

        # Transfer the NFT to the student
        transfer_txn = AssetTransfer(
            sender=Global.current_application_address,
            receiver=session.student,
            asset_id=nft_asset_id,
            amount=UInt64(1)
        )
        transfer_txn.submit()

        # Update student's NFT count and collection
        student_user = self.users[session.student]
        student_user.learner_nfts += UInt64(1)

        # Add NFT asset ID to student's collection (unique, no duplicates)
        current_nfts = student_user.nft_asset_ids
        if current_nfts == String(""):
            student_user.nft_asset_ids = String(str(nft_asset_id))
        else:
            # Check if NFT already exists to prevent duplicates
            nft_list = current_nfts.split(",")
            if str(nft_asset_id) not in nft_list:
                student_user.nft_asset_ids = String(f"{current_nfts},{nft_asset_id}")

        self.users[session.student] = student_user

        return nft_asset_id

    @abimethod()
    def cancel_session(self, session_id: UInt64) -> None:
        assert session_id in self.sessions, "Session does not exist"
        session = self.sessions[session_id]
        assert Txn.sender == session.student, "Only student can cancel session"
        assert session.status == String("booked"), "Session not in booked state"

        # Refund ASA tokens from escrow (contract) to student
        # Implement ASA transfer inner transactions here or handle externally

        session.status = String("cancelled")
        self.sessions[session_id] = session

    @abimethod()
    def transfer_tokens(self, recipient: Address, amount: UInt64) -> None:
        sender_user = self.users[Txn.sender]
        assert sender_user.token_balance >= amount, "Insufficient balance"
        sender_user.token_balance -= amount
        self.users[Txn.sender] = sender_user

        recipient_user = self.users[recipient]
        recipient_user.token_balance += amount
        self.users[recipient] = recipient_user

    @abimethod()
    def get_reputation(self, user: Address) -> UInt64:
        assert user in self.users, "User not registered"
        return self.users[user].reputation

    @abimethod()
    def get_user_balance(self, user: Address) -> UInt64:
        assert user in self.users, "User not registered"
        return self.users[user].token_balance

    @abimethod()
    def get_learner_nfts(self, user: Address) -> UInt64:
        assert user in self.users, "User not registered"
        return self.users[user].learner_nfts

    @abimethod()
    def get_user_nft_asset_ids(self, user: Address) -> String:
        assert user in self.users, "User not registered"
        return self.users[user].nft_asset_ids

    @abimethod()
    def get_skill_token_id(self) -> UInt64:
        return self.skill_token_id

    @abimethod()
    def get_available_nfts(self, user: Address) -> String:
        """Get NFTs available for claiming by user"""
        assert user in self.users, "User not registered"
        return self.users[user].available_nfts

    @abimethod()
    def claim_nft(self, user: Address, nft_id: UInt64) -> bool:
        """Claim an available NFT for the user by transferring the ASA"""
        assert user in self.users, "User not registered"
        assert Txn.sender == user, "Only the user can claim their own NFTs"

        # Check if NFT is available for this user
        available_nfts = self.users[user].available_nfts.split(",")
        if str(nft_id) not in available_nfts:
            return False

        # Transfer the NFT ASA from contract to user
        transfer_txn = AssetTransfer(
            sender=Global.current_application_address,
            receiver=user,
            asset_id=nft_id,
            amount=UInt64(1)
        )
        transfer_txn.submit()

        # Remove from available NFTs
        available_nfts.remove(str(nft_id))
        self.users[user].available_nfts = ",".join(available_nfts)

        # Add to claimed NFTs
        current_nfts = self.users[user].nft_asset_ids
        if current_nfts:
            self.users[user].nft_asset_ids = current_nfts + "," + str(nft_id)
        else:
            self.users[user].nft_asset_ids = str(nft_id)

        return True

    @abimethod()
    def award_nft_for_booking(self, user: Address, booking_id: UInt64) -> UInt64:
        """Award an NFT for successful booking by creating and transferring ASA"""
        assert user in self.users, "User not registered"

        # Create a unique NFT ASA for the booking
        nft_name = String(f"SkillSwap Booking {booking_id}")
        nft_unit_name = String(f"SB{str(booking_id)}")
        nft_url = String(f"https://skillswap.com/booking-nft/{booking_id}")

        # Create NFT asset with total supply of 1 (non-fungible)
        create_txn = AssetConfig(
            sender=Global.current_application_address,
            total=UInt64(1),
            decimals=UInt64(0),
            default_frozen=False,
            unit_name=nft_unit_name,
            asset_name=nft_name,
            url=nft_url,
            manager=Global.current_application_address,
            reserve=Global.current_application_address,
            freeze=Global.current_application_address,
            clawback=Global.current_application_address
        )
        nft_id = create_txn.submit().asset_id

        # Transfer the NFT to the user immediately (no claiming needed for booking NFTs)
        transfer_txn = AssetTransfer(
            sender=Global.current_application_address,
            receiver=user,
            asset_id=nft_id,
            amount=UInt64(1)
        )
        transfer_txn.submit()

        # Add to user's NFT collection
        current_nfts = self.users[user].nft_asset_ids
        if current_nfts:
            self.users[user].nft_asset_ids = current_nfts + "," + str(nft_id)
        else:
            self.users[user].nft_asset_ids = str(nft_id)

        return nft_id
