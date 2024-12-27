from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Define Models
class User(Base):
    __tablename__ = 'user'
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    user_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    accounts = relationship("TransactionAccount", back_populates="user")

class TransactionAccount(Base):
    __tablename__ = 'transaction_account'
    transaction_account_id = Column(Integer, primary_key=True, autoincrement=True)
    account_name = Column(String(50), nullable=False)
    balance = Column(Numeric(10, 2), default=0, nullable=False)
    user_id = Column(Integer, ForeignKey('user.user_id'))
    user = relationship("User", back_populates="accounts")

class Tag(Base):
    __tablename__ = 'tag'
    tag_id = Column(Integer, primary_key=True, autoincrement=True)
    tag_name = Column(String(50), nullable=False)
    transactions = relationship(
        "Transaction", secondary="tag_assigned_to_transaction", back_populates="tags"
    )

class Transaction(Base):
    __tablename__ = 'transaction'
    transaction_id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_name = Column(String(100), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    net_amount = Column(Numeric(10, 2), nullable=False)
    date = Column(DateTime, nullable=False)
    breakdowns = relationship("TransactionBreakdown", back_populates="transaction")
    tags = relationship(
        "Tag", secondary="tag_assigned_to_transaction", back_populates="transactions"
    )

class TransactionBreakdown(Base):
    __tablename__ = 'transaction_breakdown'
    transaction_breakdown_id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(Integer, ForeignKey('transaction.transaction_id'))
    transaction_account_id = Column(Integer, ForeignKey('transaction_account.transaction_account_id'))
    spent_amount = Column(Numeric(10, 2), nullable=False, default=0)
    earned_amount = Column(Numeric(10, 2), nullable=False, default=0)
    transaction = relationship("Transaction", back_populates="breakdowns")

class TagAssignedToTransaction(Base):
    __tablename__ = 'tag_assigned_to_transaction'
    tag_assigned_to_transaction_id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(Integer, ForeignKey('transaction.transaction_id'))
    tag_id = Column(Integer, ForeignKey('tag.tag_id'))
