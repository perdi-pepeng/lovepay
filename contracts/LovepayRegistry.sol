// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract LovepayRegistry {
    using SafeERC20 for IERC20;

    uint256 private constant _UNLOCKED = 1;
    uint256 private constant _LOCKED = 2;

    uint256 private _lockState;

    /// @notice USDC token address used for all payments.
    address public immutable usdc;

    struct Merchant {
        address wallet;
        string name;
        string email;
        string businessType;
        uint256 registeredAt;
        bool active;
    }

    struct PaymentLink {
        bytes32 id;
        address merchant;
        string title;
        uint256 amount;
        string memo;
        bool multiUse;
        uint256 paidCount;
        bool active;
        uint256 createdAt;
    }

    struct InvoiceItem {
        string description;
        uint256 qty;
        uint256 unitPrice;
    }

    struct Invoice {
        bytes32 id;
        address merchant;
        string invoiceNumber;
        string customerName;
        string customerEmail;
        bytes items;
        uint256 taxBps;
        uint256 discountBps;
        uint256 dueDate;
        uint8 status;
        uint256 total;
        uint256 createdAt;
        string notes;
    }

    struct PaymentRecord {
        bytes32 id;
        address payer;
        address merchant;
        uint256 amount;
        bytes32 linkId;
        bytes32 invoiceId;
        string memo;
        uint8 status;
        uint256 createdAt;
        bytes32 txRef;
    }

    mapping(address => Merchant) public merchants;
    mapping(address => bool) public isMerchant;

    mapping(bytes32 => PaymentLink) public paymentLinks;
    bytes32[] public allLinkIds;
    mapping(address => bytes32[]) public merchantLinkIds;

    mapping(bytes32 => Invoice) public invoices;
    mapping(address => bytes32[]) public merchantInvoiceIds;

    mapping(bytes32 => PaymentRecord) public payments;
    mapping(address => bytes32[]) public merchantPaymentIds;
    mapping(address => bytes32[]) public payerPaymentIds;
    bytes32[] public allPaymentIds;

    uint256 private _recordNonce;
    uint256 private _paymentNonce;

    event MerchantRegistered(address indexed wallet, string name, uint256 at);
    event MerchantUpdated(address indexed wallet);
    event MerchantDeactivated(address indexed wallet);

    event PaymentLinkCreated(bytes32 indexed id, address indexed merchant, uint256 amount);
    event PaymentLinkDeactivated(bytes32 indexed id);

    event InvoiceCreated(bytes32 indexed id, address indexed merchant, string invoiceNumber, uint256 total);
    event InvoiceStatusUpdated(bytes32 indexed id, uint8 status);

    event PaymentMade(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed merchant,
        uint256 amount,
        bytes32 linkId,
        bytes32 invoiceId
    );

    modifier nonReentrant() {
        require(_lockState == _UNLOCKED, "LovepayRegistry: reentrant call");
        _lockState = _LOCKED;
        _;
        _lockState = _UNLOCKED;
    }

    /// @notice Initializes the registry with the USDC token address.
    /// @param _usdc The USDC ERC20 token address.
    constructor(address _usdc) {
        require(_usdc != address(0), "LovepayRegistry: zero USDC address");
        usdc = _usdc;
        _lockState = _UNLOCKED;
    }

    /// @notice Registers the caller as a merchant.
    /// @param name Merchant display name.
    /// @param email Merchant contact email.
    /// @param businessType Merchant business category.
    function registerMerchant(string calldata name, string calldata email, string calldata businessType) external {
        require(!isMerchant[msg.sender], "LovepayRegistry: already registered");

        merchants[msg.sender] = Merchant({
            wallet: msg.sender,
            name: name,
            email: email,
            businessType: businessType,
            registeredAt: block.timestamp,
            active: true
        });
        isMerchant[msg.sender] = true;

        emit MerchantRegistered(msg.sender, name, block.timestamp);
    }

    /// @notice Updates merchant profile fields for the caller.
    /// @param name Updated merchant display name.
    /// @param email Updated merchant contact email.
    /// @param businessType Updated merchant business category.
    function updateMerchant(string calldata name, string calldata email, string calldata businessType) external {
        require(isMerchant[msg.sender], "LovepayRegistry: merchant not found");

        Merchant storage merchant = merchants[msg.sender];
        merchant.name = name;
        merchant.email = email;
        merchant.businessType = businessType;

        emit MerchantUpdated(msg.sender);
    }

    /// @notice Deactivates the caller's merchant account.
    function deactivateMerchant() external {
        require(isMerchant[msg.sender], "LovepayRegistry: merchant not found");

        merchants[msg.sender].active = false;

        emit MerchantDeactivated(msg.sender);
    }

    /// @notice Creates a payment link for the caller.
    /// @param title Payment link title.
    /// @param amount Fixed payment amount in USDC micro-units, or 0 for open amount.
    /// @param memo Optional memo shown with the link.
    /// @param multiUse True if link can be used multiple times, false for single-use.
    /// @return linkId The created payment link identifier.
    function createPaymentLink(
        string calldata title,
        uint256 amount,
        string calldata memo,
        bool multiUse
    ) external returns (bytes32 linkId) {
        require(isMerchant[msg.sender] && merchants[msg.sender].active, "LovepayRegistry: inactive merchant");
        require(bytes(title).length > 0, "LovepayRegistry: empty title");

        ++_recordNonce;
        linkId = keccak256(abi.encodePacked(msg.sender, title, block.timestamp, _recordNonce));
        require(paymentLinks[linkId].createdAt == 0, "LovepayRegistry: link id collision");

        paymentLinks[linkId] = PaymentLink({
            id: linkId,
            merchant: msg.sender,
            title: title,
            amount: amount,
            memo: memo,
            multiUse: multiUse,
            paidCount: 0,
            active: true,
            createdAt: block.timestamp
        });

        allLinkIds.push(linkId);
        merchantLinkIds[msg.sender].push(linkId);

        emit PaymentLinkCreated(linkId, msg.sender, amount);
    }

    /// @notice Deactivates a payment link owned by the caller.
    /// @param linkId The payment link identifier.
    function deactivatePaymentLink(bytes32 linkId) external {
        require(paymentLinks[linkId].merchant == msg.sender, "LovepayRegistry: not link owner");

        paymentLinks[linkId].active = false;

        emit PaymentLinkDeactivated(linkId);
    }

    /// @notice Parameters for createInvoice to avoid stack-too-deep.
    struct CreateInvoiceParams {
        string invoiceNumber;
        string customerName;
        string customerEmail;
        bytes encodedItems;
        uint256 taxBps;
        uint256 discountBps;
        uint256 dueDate;
        uint256 total;
        string notes;
    }

    /// @notice Creates an invoice under the caller merchant account.
    /// @param p Invoice creation parameters packed into a struct.
    /// @return invoiceId The created invoice identifier.
    function createInvoice(CreateInvoiceParams calldata p) external returns (bytes32 invoiceId) {
        require(isMerchant[msg.sender] && merchants[msg.sender].active, "LovepayRegistry: inactive merchant");

        ++_recordNonce;
        invoiceId = keccak256(abi.encodePacked(msg.sender, p.invoiceNumber, block.timestamp, _recordNonce));
        require(invoices[invoiceId].createdAt == 0, "LovepayRegistry: invoice id collision");

        Invoice storage inv = invoices[invoiceId];
        inv.id = invoiceId;
        inv.merchant = msg.sender;
        inv.invoiceNumber = p.invoiceNumber;
        inv.customerName = p.customerName;
        inv.customerEmail = p.customerEmail;
        inv.items = p.encodedItems;
        inv.taxBps = p.taxBps;
        inv.discountBps = p.discountBps;
        inv.dueDate = p.dueDate;
        inv.status = 0;
        inv.total = p.total;
        inv.createdAt = block.timestamp;
        inv.notes = p.notes;

        merchantInvoiceIds[msg.sender].push(invoiceId);

        emit InvoiceCreated(invoiceId, msg.sender, p.invoiceNumber, p.total);
    }

    /// @notice Updates invoice status for an invoice owned by the caller.
    /// @param invoiceId The invoice identifier.
    /// @param status New status value (0=draft, 1=sent, 2=paid, 3=overdue).
    function updateInvoiceStatus(bytes32 invoiceId, uint8 status) external {
        require(invoices[invoiceId].merchant == msg.sender, "LovepayRegistry: not invoice owner");
        require(status <= 3, "LovepayRegistry: invalid status");

        invoices[invoiceId].status = status;

        emit InvoiceStatusUpdated(invoiceId, status);
    }

    /// @notice Pays a merchant in USDC and stores a payment record.
    /// @param merchant The merchant wallet to receive funds.
    /// @param amount Amount in USDC micro-units.
    /// @param linkId Related payment link id, or zero bytes32 for direct payment.
    /// @param invoiceId Related invoice id, or zero bytes32 if not paying an invoice.
    /// @param memo Optional payment memo.
    /// @return paymentId The created payment record identifier.
    function pay(
        address merchant,
        uint256 amount,
        bytes32 linkId,
        bytes32 invoiceId,
        string calldata memo
    ) external nonReentrant returns (bytes32 paymentId) {
        require(amount > 0, "LovepayRegistry: zero amount");
        require(merchant != address(0), "LovepayRegistry: zero merchant");
        require(merchant != msg.sender, "LovepayRegistry: self payment");
        require(isMerchant[merchant] && merchants[merchant].active, "LovepayRegistry: inactive merchant");

        if (linkId != bytes32(0)) {
            PaymentLink storage link = paymentLinks[linkId];
            require(link.active, "LovepayRegistry: inactive link");
            require(link.merchant == merchant, "LovepayRegistry: link merchant mismatch");
            if (link.amount > 0) {
                require(amount == link.amount, "LovepayRegistry: wrong fixed amount");
            }
        }

        if (invoiceId != bytes32(0)) {
            Invoice storage invoice = invoices[invoiceId];
            require(invoice.merchant == merchant, "LovepayRegistry: invoice merchant mismatch");
            require(invoice.status != 2, "LovepayRegistry: invoice already paid");
            require(amount == invoice.total, "LovepayRegistry: amount must equal invoice total");
        }

        ++_paymentNonce;
        paymentId = keccak256(abi.encodePacked(msg.sender, merchant, amount, block.timestamp, _paymentNonce));
        require(payments[paymentId].createdAt == 0, "LovepayRegistry: payment id collision");

        bytes32 txRef = keccak256(
            abi.encodePacked(
                block.chainid,
                block.number,
                msg.sender,
                merchant,
                amount,
                linkId,
                invoiceId,
                memo,
                paymentId
            )
        );

        payments[paymentId] = PaymentRecord({
            id: paymentId,
            payer: msg.sender,
            merchant: merchant,
            amount: amount,
            linkId: linkId,
            invoiceId: invoiceId,
            memo: memo,
            status: 1,
            createdAt: block.timestamp,
            txRef: txRef
        });

        if (linkId != bytes32(0)) {
            PaymentLink storage linkToUpdate = paymentLinks[linkId];
            if (!linkToUpdate.multiUse) {
                linkToUpdate.active = false;
            }
            linkToUpdate.paidCount += 1;
        }

        if (invoiceId != bytes32(0)) {
            invoices[invoiceId].status = 2;
        }

        allPaymentIds.push(paymentId);
        merchantPaymentIds[merchant].push(paymentId);
        payerPaymentIds[msg.sender].push(paymentId);

        IERC20(usdc).safeTransferFrom(msg.sender, merchant, amount);

        emit PaymentMade(paymentId, msg.sender, merchant, amount, linkId, invoiceId);
    }

    /// @notice Returns all payment link ids created by a merchant.
    /// @param merchant The merchant wallet.
    /// @return ids Array of payment link ids.
    function getMerchantLinkIds(address merchant) external view returns (bytes32[] memory ids) {
        return merchantLinkIds[merchant];
    }

    /// @notice Returns all invoice ids created by a merchant.
    /// @param merchant The merchant wallet.
    /// @return ids Array of invoice ids.
    function getMerchantInvoiceIds(address merchant) external view returns (bytes32[] memory ids) {
        return merchantInvoiceIds[merchant];
    }

    /// @notice Returns all payment ids received by a merchant.
    /// @param merchant The merchant wallet.
    /// @return ids Array of payment ids.
    function getMerchantPaymentIds(address merchant) external view returns (bytes32[] memory ids) {
        return merchantPaymentIds[merchant];
    }

    /// @notice Returns all payment ids made by a payer.
    /// @param payer The payer wallet.
    /// @return ids Array of payment ids.
    function getPayerPaymentIds(address payer) external view returns (bytes32[] memory ids) {
        return payerPaymentIds[payer];
    }

    /// @notice Returns the number of stored payment records.
    /// @return count Total count of payment record ids.
    function getAllPaymentCount() external view returns (uint256 count) {
        return allPaymentIds.length;
    }

    /// @notice Returns the number of stored payment links.
    /// @return count Total count of payment link ids.
    function getAllLinkCount() external view returns (uint256 count) {
        return allLinkIds.length;
    }
}
