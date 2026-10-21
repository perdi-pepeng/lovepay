// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {LovepayRegistry} from "../LovepayRegistry.sol";
import {MockERC20} from "../test-helpers/MockERC20.sol";

// ─────────────────────────────────────────────────────────────────────────────
//  Handler for invariant_PaidCountNeverDecreases
// ─────────────────────────────────────────────────────────────────────────────
contract PayHandler is Test {
    LovepayRegistry public registry;
    MockERC20 public usdc;

    address public merchant;
    address public payer;

    // ghost: running total of paidCount increments across all links we create
    uint256 public ghostTotalPaidCount;
    bytes32[] public createdLinks;

    constructor(LovepayRegistry _registry, MockERC20 _usdc, address _merchant, address _payer) {
        registry = _registry;
        usdc = _usdc;
        merchant = _merchant;
        payer = _payer;
    }

    /// @dev Handler action: create a multi-use link as merchant
    function createLink(string calldata title) external {
        string memory t = bytes(title).length == 0 ? "link" : title;
        vm.prank(merchant);
        bytes32 linkId = registry.createPaymentLink(t, 0, "", true);
        createdLinks.push(linkId);
    }

    /// @dev Handler action: pay via a link (picks the last created link)
    function payViaLink(uint256 amount) external {
        if (createdLinks.length == 0) return;
        amount = bound(amount, 1, 1_000_000e6);
        bytes32 linkId = createdLinks[createdLinks.length - 1];
        // Check link still active
        (, , , , , , , bool active, ) = registry.paymentLinks(linkId);
        if (!active) return;

        usdc.mint(payer, amount);
        vm.prank(payer);
        usdc.approve(address(registry), amount);
        vm.prank(payer);
        registry.pay(merchant, amount, linkId, bytes32(0), "");
        ghostTotalPaidCount += 1;
    }

    /// @dev Helper to read the on-chain total paidCount across all tracked links
    function onChainTotalPaidCount() external view returns (uint256 total) {
        for (uint256 i = 0; i < createdLinks.length; i++) {
            (, , , , , , uint256 pc, , ) = registry.paymentLinks(createdLinks[i]);
            total += pc;
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main test contract
// ─────────────────────────────────────────────────────────────────────────────
contract LovepayRegistryTest is Test {
    LovepayRegistry internal registry;
    MockERC20 internal usdc;

    address internal owner    = makeAddr("owner");
    address internal merchant = makeAddr("merchant");
    address internal alice    = makeAddr("alice");
    address internal payer    = makeAddr("payer");

    uint256 internal constant USDC_SEED = 100_000e6;

    // ── helper: build a minimal CreateInvoiceParams ──────────────────────────
    function _invoiceParams(uint256 total)
        internal
        view
        returns (LovepayRegistry.CreateInvoiceParams memory p)
    {
        LovepayRegistry.InvoiceItem[] memory items = new LovepayRegistry.InvoiceItem[](0);
        p = LovepayRegistry.CreateInvoiceParams({
            invoiceNumber: "INV-001",
            customerName:  "Alice",
            customerEmail: "alice@example.com",
            encodedItems:  abi.encode(items),
            taxBps:        0,
            discountBps:   0,
            dueDate:       block.timestamp + 30 days,
            total:         total,
            notes:         "test invoice"
        });
    }

    // ── helper: register merchant ─────────────────────────────────────────────
    function _registerMerchant(address m) internal {
        vm.prank(m);
        registry.registerMerchant("Acme", "acme@test.com", "retail");
    }

    // ── helper: seed payer with USDC and max-approve registry ─────────────────
    function _seedAndApprove(address who, uint256 amount) internal {
        usdc.mint(who, amount);
        vm.prank(who);
        usdc.approve(address(registry), type(uint256).max);
    }

    function setUp() public {
        usdc = new MockERC20("Mock USDC", "mUSDC", 6);
        registry = new LovepayRegistry(address(usdc));
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  1. registerMerchant
    // ══════════════════════════════════════════════════════════════════════════

    function test_RegisterMerchant_HappyPath() public {
        vm.prank(merchant);
        vm.expectEmit(true, false, false, true, address(registry));
        emit LovepayRegistry.MerchantRegistered(merchant, "Acme", block.timestamp);
        registry.registerMerchant("Acme", "acme@test.com", "retail");

        // isMerchant flag set
        assertTrue(registry.isMerchant(merchant));

        // struct fields correct
        (
            address wallet,
            string memory name,
            string memory email,
            string memory businessType,
            ,
            bool active
        ) = registry.merchants(merchant);

        assertEq(wallet, merchant);
        assertEq(name, "Acme");
        assertEq(email, "acme@test.com");
        assertEq(businessType, "retail");
        assertTrue(active);
    }

    function test_RegisterMerchant_RevertDuplicate() public {
        _registerMerchant(merchant);

        vm.prank(merchant);
        vm.expectRevert(bytes("LovepayRegistry: already registered"));
        registry.registerMerchant("Acme2", "x@test.com", "tech");
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  2. updateMerchant
    // ══════════════════════════════════════════════════════════════════════════

    function test_UpdateMerchant_HappyPath() public {
        _registerMerchant(merchant);

        vm.prank(merchant);
        vm.expectEmit(true, false, false, false, address(registry));
        emit LovepayRegistry.MerchantUpdated(merchant);
        registry.updateMerchant("NewName", "new@test.com", "ecommerce");

        (, string memory name, string memory email, string memory biz, , ) =
            registry.merchants(merchant);
        assertEq(name, "NewName");
        assertEq(email, "new@test.com");
        assertEq(biz, "ecommerce");
    }

    function test_UpdateMerchant_RevertNotRegistered() public {
        vm.prank(alice);
        vm.expectRevert(bytes("LovepayRegistry: merchant not found"));
        registry.updateMerchant("X", "x@test.com", "none");
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  3. deactivateMerchant
    // ══════════════════════════════════════════════════════════════════════════

    function test_DeactivateMerchant_HappyPath() public {
        _registerMerchant(merchant);

        vm.prank(merchant);
        vm.expectEmit(true, false, false, false, address(registry));
        emit LovepayRegistry.MerchantDeactivated(merchant);
        registry.deactivateMerchant();

        (, , , , , bool active) = registry.merchants(merchant);
        assertFalse(active);
    }

    function test_DeactivateMerchant_RevertNotRegistered() public {
        vm.prank(alice);
        vm.expectRevert(bytes("LovepayRegistry: merchant not found"));
        registry.deactivateMerchant();
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  4. createPaymentLink
    // ══════════════════════════════════════════════════════════════════════════

    function test_CreatePaymentLink_HappyPath() public {
        _registerMerchant(merchant);

        vm.prank(merchant);
        bytes32 linkId = registry.createPaymentLink("Buy now", 50e6, "memo", true);

        // returned id is non-zero
        assertTrue(linkId != bytes32(0));

        // stored correctly
        (
            bytes32 storedId,
            address storedMerchant,
            string memory title,
            uint256 amount,
            string memory memo,
            bool multiUse,
            uint256 paidCount,
            bool active,
            uint256 createdAt
        ) = registry.paymentLinks(linkId);

        assertEq(storedId, linkId);
        assertEq(storedMerchant, merchant);
        assertEq(title, "Buy now");
        assertEq(amount, 50e6);
        assertEq(memo, "memo");
        assertTrue(multiUse);
        assertEq(paidCount, 0);
        assertTrue(active);
        assertEq(createdAt, block.timestamp);

        // view helpers updated
        assertEq(registry.getAllLinkCount(), 1);
        bytes32[] memory ids = registry.getMerchantLinkIds(merchant);
        assertEq(ids.length, 1);
        assertEq(ids[0], linkId);
    }

    function test_CreatePaymentLink_EmitsEvent() public {
        _registerMerchant(merchant);

        // checkTopic1=false (linkId unknown), checkTopic2=true (merchant), checkTopic3=false, checkData=false
        vm.prank(merchant);
        vm.expectEmit(false, true, false, false, address(registry));
        emit LovepayRegistry.PaymentLinkCreated(bytes32(0), merchant, 50e6);
        registry.createPaymentLink("Buy now", 50e6, "memo", true);
    }

    function test_CreatePaymentLink_RevertNotMerchant() public {
        vm.prank(alice);
        vm.expectRevert(bytes("LovepayRegistry: inactive merchant"));
        registry.createPaymentLink("Link", 0, "", true);
    }

    function test_CreatePaymentLink_RevertInactiveMerchant() public {
        _registerMerchant(merchant);
        vm.prank(merchant);
        registry.deactivateMerchant();

        vm.prank(merchant);
        vm.expectRevert(bytes("LovepayRegistry: inactive merchant"));
        registry.createPaymentLink("Link", 0, "", true);
    }

    function test_CreatePaymentLink_RevertEmptyTitle() public {
        _registerMerchant(merchant);

        vm.prank(merchant);
        vm.expectRevert(bytes("LovepayRegistry: empty title"));
        registry.createPaymentLink("", 0, "", true);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  5. deactivatePaymentLink
    // ══════════════════════════════════════════════════════════════════════════

    function test_DeactivatePaymentLink_HappyPath() public {
        _registerMerchant(merchant);
        vm.prank(merchant);
        bytes32 linkId = registry.createPaymentLink("Buy now", 0, "", true);

        vm.prank(merchant);
        vm.expectEmit(true, false, false, false, address(registry));
        emit LovepayRegistry.PaymentLinkDeactivated(linkId);
        registry.deactivatePaymentLink(linkId);

        (, , , , , , , bool active, ) = registry.paymentLinks(linkId);
        assertFalse(active);
    }

    function test_DeactivatePaymentLink_RevertNotOwner() public {
        _registerMerchant(merchant);
        vm.prank(merchant);
        bytes32 linkId = registry.createPaymentLink("Buy now", 0, "", true);

        vm.prank(alice);
        vm.expectRevert(bytes("LovepayRegistry: not link owner"));
        registry.deactivatePaymentLink(linkId);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  6. createInvoice
    // ══════════════════════════════════════════════════════════════════════════

    function test_CreateInvoice_HappyPath() public {
        _registerMerchant(merchant);
        LovepayRegistry.CreateInvoiceParams memory p = _invoiceParams(200e6);

        vm.prank(merchant);
        vm.expectEmit(false, true, false, false, address(registry));
        emit LovepayRegistry.InvoiceCreated(bytes32(0), merchant, "INV-001", 200e6);
        bytes32 invoiceId = registry.createInvoice(p);

        assertTrue(invoiceId != bytes32(0));

        (
            bytes32 storedId,
            address storedMerchant,
            string memory invNum,
            string memory custName,
            ,
            ,
            ,
            ,
            ,
            uint8 status,
            uint256 total,
            uint256 createdAt,
            string memory notes
        ) = registry.invoices(invoiceId);

        assertEq(storedId, invoiceId);
        assertEq(storedMerchant, merchant);
        assertEq(invNum, "INV-001");
        assertEq(custName, "Alice");
        assertEq(status, 0);
        assertEq(total, 200e6);
        assertEq(createdAt, block.timestamp);
        assertEq(notes, "test invoice");

        bytes32[] memory invIds = registry.getMerchantInvoiceIds(merchant);
        assertEq(invIds.length, 1);
        assertEq(invIds[0], invoiceId);
    }

    function test_CreateInvoice_RevertNotMerchant() public {
        LovepayRegistry.CreateInvoiceParams memory p = _invoiceParams(100e6);

        vm.prank(alice);
        vm.expectRevert(bytes("LovepayRegistry: inactive merchant"));
        registry.createInvoice(p);
    }

    function test_CreateInvoice_RevertInactiveMerchant() public {
        _registerMerchant(merchant);
        vm.prank(merchant);
        registry.deactivateMerchant();

        LovepayRegistry.CreateInvoiceParams memory p = _invoiceParams(100e6);
        vm.prank(merchant);
        vm.expectRevert(bytes("LovepayRegistry: inactive merchant"));
        registry.createInvoice(p);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  7. updateInvoiceStatus
    // ══════════════════════════════════════════════════════════════════════════

    function test_UpdateInvoiceStatus_FullCycle() public {
        _registerMerchant(merchant);
        vm.prank(merchant);
        bytes32 invoiceId = registry.createInvoice(_invoiceParams(100e6));

        // 0 → 1 (sent)
        vm.prank(merchant);
        vm.expectEmit(true, false, false, true, address(registry));
        emit LovepayRegistry.InvoiceStatusUpdated(invoiceId, 1);
        registry.updateInvoiceStatus(invoiceId, 1);
        (, , , , , , , , , uint8 s, , , ) = registry.invoices(invoiceId);
        assertEq(s, 1);

        // 1 → 2 (paid)
        vm.prank(merchant);
        registry.updateInvoiceStatus(invoiceId, 2);
        (, , , , , , , , , s, , , ) = registry.invoices(invoiceId);
        assertEq(s, 2);

        // 2 → 3 (overdue)
        vm.prank(merchant);
        registry.updateInvoiceStatus(invoiceId, 3);
        (, , , , , , , , , s, , , ) = registry.invoices(invoiceId);
        assertEq(s, 3);
    }

    function test_UpdateInvoiceStatus_RevertNotOwner() public {
        _registerMerchant(merchant);
        vm.prank(merchant);
        bytes32 invoiceId = registry.createInvoice(_invoiceParams(100e6));

        vm.prank(alice);
        vm.expectRevert(bytes("LovepayRegistry: not invoice owner"));
        registry.updateInvoiceStatus(invoiceId, 1);
    }

    function test_UpdateInvoiceStatus_RevertInvalidStatus() public {
        _registerMerchant(merchant);
        vm.prank(merchant);
        bytes32 invoiceId = registry.createInvoice(_invoiceParams(100e6));

        vm.prank(merchant);
        vm.expectRevert(bytes("LovepayRegistry: invalid status"));
        registry.updateInvoiceStatus(invoiceId, 4);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  8. pay — happy path
    // ══════════════════════════════════════════════════════════════════════════

    function test_Pay_HappyPath() public {
        _registerMerchant(merchant);
        _seedAndApprove(payer, USDC_SEED);

        uint256 merchantBefore = usdc.balanceOf(merchant);
        uint256 payerBefore    = usdc.balanceOf(payer);

        vm.prank(payer);
        vm.expectEmit(false, true, true, false, address(registry));
        emit LovepayRegistry.PaymentMade(bytes32(0), payer, merchant, 100e6, bytes32(0), bytes32(0));
        bytes32 paymentId = registry.pay(merchant, 100e6, bytes32(0), bytes32(0), "hello");

        // paymentId is non-zero
        assertTrue(paymentId != bytes32(0));

        // USDC transferred
        assertEq(usdc.balanceOf(merchant), merchantBefore + 100e6);
        assertEq(usdc.balanceOf(payer),    payerBefore    - 100e6);

        // Payment record stored
        (
            bytes32 storedId,
            address storedPayer,
            address storedMerchant,
            uint256 amount,
            bytes32 storedLinkId,
            bytes32 storedInvoiceId,
            string memory memo,
            uint8 status,
            uint256 createdAt,
            /* txRef */,
            /* blockNumber */
        ) = registry.payments(paymentId);

        assertEq(storedId, paymentId);
        assertEq(storedPayer, payer);
        assertEq(storedMerchant, merchant);
        assertEq(amount, 100e6);
        assertEq(storedLinkId, bytes32(0));
        assertEq(storedInvoiceId, bytes32(0));
        assertEq(memo, "hello");
        assertEq(status, 1);
        assertEq(createdAt, block.timestamp);

        // Indexes updated
        assertEq(registry.getAllPaymentCount(), 1);
        bytes32[] memory mp = registry.getMerchantPaymentIds(merchant);
        assertEq(mp.length, 1);
        assertEq(mp[0], paymentId);
        bytes32[] memory pp = registry.getPayerPaymentIds(payer);
        assertEq(pp.length, 1);
        assertEq(pp[0], paymentId);
    }

    function test_Pay_RevertZeroAmount() public {
        _registerMerchant(merchant);
        _seedAndApprove(payer, USDC_SEED);

        vm.prank(payer);
        vm.expectRevert(bytes("LovepayRegistry: zero amount"));
        registry.pay(merchant, 0, bytes32(0), bytes32(0), "");
    }

    function test_Pay_RevertZeroMerchant() public {
        _seedAndApprove(payer, USDC_SEED);

        vm.prank(payer);
        vm.expectRevert(bytes("LovepayRegistry: zero merchant"));
        registry.pay(address(0), 100e6, bytes32(0), bytes32(0), "");
    }

    function test_Pay_RevertSelfPayment() public {
        _registerMerchant(merchant);
        _seedAndApprove(merchant, USDC_SEED);

        vm.prank(merchant);
        vm.expectRevert(bytes("LovepayRegistry: self payment"));
        registry.pay(merchant, 100e6, bytes32(0), bytes32(0), "");
    }

    function test_Pay_RevertNotRegisteredMerchant() public {
        _seedAndApprove(payer, USDC_SEED);

        vm.prank(payer);
        vm.expectRevert(bytes("LovepayRegistry: inactive merchant"));
        registry.pay(alice, 100e6, bytes32(0), bytes32(0), "");
    }

    function test_Pay_RevertInactiveMerchant() public {
        _registerMerchant(merchant);
        vm.prank(merchant);
        registry.deactivateMerchant();

        _seedAndApprove(payer, USDC_SEED);

        vm.prank(payer);
        vm.expectRevert(bytes("LovepayRegistry: inactive merchant"));
        registry.pay(merchant, 100e6, bytes32(0), bytes32(0), "");
    }

    // ── pay with single-use link ───────────────────────────────────────────────

    function test_Pay_SingleUseLink_DeactivatesAndIncrements() public {
        _registerMerchant(merchant);
        vm.prank(merchant);
        bytes32 linkId = registry.createPaymentLink("Single", 0, "", false); // single-use

        _seedAndApprove(payer, USDC_SEED);

        vm.prank(payer);
        registry.pay(merchant, 50e6, linkId, bytes32(0), "");

        // Link deactivated
        (, , , , , , uint256 paidCount, bool active, ) = registry.paymentLinks(linkId);
        assertFalse(active);
        assertEq(paidCount, 1);
    }

    // ── pay with multi-use link ───────────────────────────────────────────────

    function test_Pay_MultiUseLink_StaysActiveAndIncrements() public {
        _registerMerchant(merchant);
        vm.prank(merchant);
        bytes32 linkId = registry.createPaymentLink("Multi", 0, "", true); // multi-use

        _seedAndApprove(payer, USDC_SEED);

        vm.prank(payer);
        registry.pay(merchant, 50e6, linkId, bytes32(0), "");

        (, , , , , , uint256 paidCount, bool active, ) = registry.paymentLinks(linkId);
        assertTrue(active);
        assertEq(paidCount, 1);

        // Pay again
        vm.prank(payer);
        registry.pay(merchant, 50e6, linkId, bytes32(0), "");
        (, , , , , , paidCount, active, ) = registry.paymentLinks(linkId);
        assertTrue(active);
        assertEq(paidCount, 2);
    }

    // ── pay with fixed-amount link: revert if wrong amount ────────────────────

    function test_Pay_FixedAmountLink_RevertWrongAmount() public {
        _registerMerchant(merchant);
        vm.prank(merchant);
        bytes32 linkId = registry.createPaymentLink("Fixed", 100e6, "", true);

        _seedAndApprove(payer, USDC_SEED);

        vm.prank(payer);
        vm.expectRevert(bytes("LovepayRegistry: wrong fixed amount"));
        registry.pay(merchant, 50e6, linkId, bytes32(0), "");
    }

    // ── pay with invoiceId ────────────────────────────────────────────────────

    function test_Pay_WithInvoice_SetsStatusPaid() public {
        _registerMerchant(merchant);
        vm.prank(merchant);
        bytes32 invoiceId = registry.createInvoice(_invoiceParams(150e6));

        _seedAndApprove(payer, USDC_SEED);

        vm.prank(payer);
        registry.pay(merchant, 150e6, bytes32(0), invoiceId, "");

        (, , , , , , , , , uint8 status, , , ) = registry.invoices(invoiceId);
        assertEq(status, 2);
    }

    function test_Pay_WithInvoice_RevertAlreadyPaid() public {
        _registerMerchant(merchant);
        vm.prank(merchant);
        bytes32 invoiceId = registry.createInvoice(_invoiceParams(150e6));

        _seedAndApprove(payer, USDC_SEED);

        vm.prank(payer);
        registry.pay(merchant, 150e6, bytes32(0), invoiceId, "");

        // Try paying again
        vm.prank(payer);
        vm.expectRevert(bytes("LovepayRegistry: invoice already paid"));
        registry.pay(merchant, 150e6, bytes32(0), invoiceId, "");
    }

    function test_Pay_WithInvoice_RevertWrongAmount() public {
        _registerMerchant(merchant);
        vm.prank(merchant);
        bytes32 invoiceId = registry.createInvoice(_invoiceParams(150e6));

        _seedAndApprove(payer, USDC_SEED);

        vm.prank(payer);
        vm.expectRevert(bytes("LovepayRegistry: amount must equal invoice total"));
        registry.pay(merchant, 100e6, bytes32(0), invoiceId, "");
    }

    // ── collision resistance ──────────────────────────────────────────────────

    function test_Pay_CollisionResistance_SameBlock() public {
        _registerMerchant(merchant);
        _seedAndApprove(payer, USDC_SEED);

        // Warp to a fixed timestamp so both payments are in "the same block"
        vm.warp(1_700_000_000);

        vm.prank(payer);
        bytes32 id1 = registry.pay(merchant, 1e6, bytes32(0), bytes32(0), "");

        vm.prank(payer);
        bytes32 id2 = registry.pay(merchant, 1e6, bytes32(0), bytes32(0), "");

        // Must be different even though same block.timestamp
        assertNotEq(id1, id2);

        // Both stored
        assertEq(registry.getAllPaymentCount(), 2);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  9. View helpers
    // ══════════════════════════════════════════════════════════════════════════

    function test_ViewHelpers_AllReturnCorrectData() public {
        _registerMerchant(merchant);
        _seedAndApprove(payer, USDC_SEED);

        // Before any state: all counts = 0
        assertEq(registry.getAllLinkCount(), 0);
        assertEq(registry.getAllPaymentCount(), 0);
        assertEq(registry.getMerchantLinkIds(merchant).length, 0);
        assertEq(registry.getMerchantInvoiceIds(merchant).length, 0);
        assertEq(registry.getMerchantPaymentIds(merchant).length, 0);
        assertEq(registry.getPayerPaymentIds(payer).length, 0);

        // Create link
        vm.prank(merchant);
        registry.createPaymentLink("ViewLink", 0, "", true);
        assertEq(registry.getAllLinkCount(), 1);
        assertEq(registry.getMerchantLinkIds(merchant).length, 1);

        // Create invoice
        vm.prank(merchant);
        registry.createInvoice(_invoiceParams(50e6));
        assertEq(registry.getMerchantInvoiceIds(merchant).length, 1);

        // Pay
        vm.prank(payer);
        registry.pay(merchant, 25e6, bytes32(0), bytes32(0), "");
        assertEq(registry.getAllPaymentCount(), 1);
        assertEq(registry.getMerchantPaymentIds(merchant).length, 1);
        assertEq(registry.getPayerPaymentIds(payer).length, 1);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  10. Fuzz: pay() amount parameter
    // ══════════════════════════════════════════════════════════════════════════

    function testFuzz_Pay_Amount(uint256 amount) public {
        _registerMerchant(merchant);

        // Clamp to a sane range: 1 wei → 1 billion USDC (6 decimals)
        amount = bound(amount, 1, 1_000_000_000e6);

        // Seed payer with exactly that amount and approve
        usdc.mint(payer, amount);
        vm.prank(payer);
        usdc.approve(address(registry), amount);

        uint256 merchantBefore = usdc.balanceOf(merchant);
        uint256 payerBefore    = usdc.balanceOf(payer);

        vm.prank(payer);
        bytes32 paymentId = registry.pay(merchant, amount, bytes32(0), bytes32(0), "");

        // PROPERTY: USDC conservation — exact amount moved from payer to merchant
        assertEq(usdc.balanceOf(merchant), merchantBefore + amount);
        assertEq(usdc.balanceOf(payer),    payerBefore    - amount);
        assertTrue(paymentId != bytes32(0));
    }

    function testFuzz_Pay_ZeroAmountReverts(uint256 /* seed */) public {
        _registerMerchant(merchant);
        _seedAndApprove(payer, USDC_SEED);

        // amount = 0 must always revert
        vm.prank(payer);
        vm.expectRevert(bytes("LovepayRegistry: zero amount"));
        registry.pay(merchant, 0, bytes32(0), bytes32(0), "");
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  11. Constructor
    // ══════════════════════════════════════════════════════════════════════════

    function test_Constructor_StoresUSDC() public view {
        assertEq(registry.usdc(), address(usdc));
    }

    function test_Constructor_RevertZeroUSDC() public {
        vm.expectRevert(bytes("LovepayRegistry: zero USDC address"));
        new LovepayRegistry(address(0));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Invariant test: paidCount across all links never decreases
// ─────────────────────────────────────────────────────────────────────────────
contract LovepayRegistryInvariantTest is Test {
    LovepayRegistry internal registry;
    MockERC20 internal usdc;
    PayHandler internal handler;

    address internal merchant = makeAddr("invMerchant");
    address internal payer    = makeAddr("invPayer");

    function setUp() public {
        usdc = new MockERC20("Mock USDC", "mUSDC", 6);
        registry = new LovepayRegistry(address(usdc));

        // Register the merchant for the handler
        vm.prank(merchant);
        registry.registerMerchant("InvMerchant", "inv@test.com", "retail");

        handler = new PayHandler(registry, usdc, merchant, payer);

        // Pre-create one multi-use link so the handler can start paying immediately
        vm.prank(merchant);
        registry.createPaymentLink("InvLink", 0, "", true);
        // Note: handler tracks its own links; this seed link is available globally

        targetContract(address(handler));
    }

    /// @notice INVARIANT: the on-chain total paidCount across tracked links
    ///         must always equal the ghost count the handler accumulated.
    ///         It must never decrease.
    function invariant_PaidCountNeverDecreases() public view {
        assertEq(handler.onChainTotalPaidCount(), handler.ghostTotalPaidCount());
    }
}
