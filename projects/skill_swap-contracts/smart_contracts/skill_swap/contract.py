from algopy import ARC4Contract, String, UInt64, Global, Txn, Asset
from algopy.arc4 import abimethod, Struct
from algopy import Address, GlobalStateMap


class User(Struct):
    name: String
    reputation: UInt64
    token_balance: UInt64  # tracked internally, optional


class Skill(Struct):
    teacher: Address
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
    users: GlobalStateMap[Address, User]
    skills: GlobalStateMap[UInt64, Skill]
    sessions: GlobalStateMap[UInt64, Session]
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
        user = User(name=name, reputation=UInt64(0), token_balance=UInt64(0))
        self.users[Txn.sender] = user

    @abimethod()
    def list_skill(self, name: String, description: String, hourly_rate: UInt64) -> UInt64:
        assert Txn.sender in self.users, "User must register first"
        skill_id = self.next_skill_id
        skill = Skill(
            teacher=Txn.sender,
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
