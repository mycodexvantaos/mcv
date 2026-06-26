from pydantic import BaseModel
from typing import List, Optional


class DataPractices(BaseModel):
    retention: bool = False
    encryption: bool = False
    selling: bool = False
    crossBorder: bool = False


class ComplianceFlags(BaseModel):
    gdpr: bool = False
    ccpa: bool = False
    coppa: bool = False
    pipeda: bool = False


class UserRights(BaseModel):
    access: bool = False
    deletion: bool = False
    optout: bool = False
    portability: bool = False
    rectification: bool = False


class GenerateRequest(BaseModel):
    docType: str
    docTypeName: str
    companyName: str
    websiteUrl: str
    contactEmail: str
    industry: Optional[str] = ""
    address: Optional[str] = ""
    jurisdiction: str = "us"
    productDesc: Optional[str] = ""
    dataTypes: List[str] = []
    thirdParties: List[str] = []
    dataPractices: DataPractices = DataPractices()
    compliance: ComplianceFlags = ComplianceFlags()
    userRights: UserRights = UserRights()


class DocumentMeta(BaseModel):
    id: str
    docType: str
    docTypeName: str
    companyName: str
    createdAt: str
    wordCount: int
    sectionCount: int
    filename: str
