document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('orderForm');
    const formSection = document.getElementById('form-section');
    const resultSection = document.getElementById('result-section');
    const adminSection = document.getElementById('admin-section');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');

    // Display fields
    const resOrderId = document.getElementById('resOrderId');
    const resPurpose = document.getElementById('resPurpose');
    const newRequestBtn = document.getElementById('newRequestBtn');
    const waUserBtn = document.getElementById('waUserBtn');
    const broadcastSection = document.getElementById('broadcast-section');
    const creditSection = document.getElementById('credit-section');

    // Google Apps Script Web App URL
    const API_URL = "https://script.google.com/macros/s/AKfycbwesLZXRI59QYjys7r_DhvATQGwBAxnVj5tNk9rpbyLIisrniXfrulHQe0dOSNjyqnO/exec";

    // Admin UI
    const tabBtns = document.querySelectorAll('.tab-btn');
    const orderListEl = document.getElementById('orderList');
    const refreshBtn = document.getElementById('refreshBtn');

    // Tab Switching Logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            tabBtns.forEach(b => b.classList.remove('active'));
            formSection.classList.add('hidden');
            resultSection.classList.add('hidden');
            adminSection.classList.add('hidden');
            if (broadcastSection) broadcastSection.classList.add('hidden');
            if (creditSection) creditSection.classList.add('hidden');

            formSection.classList.remove('active');
            resultSection.classList.remove('active');
            adminSection.classList.remove('active');
            if (broadcastSection) broadcastSection.classList.remove('active');
            if (creditSection) creditSection.classList.remove('active');

            // Add active to clicked
            btn.classList.add('active');

            // Show target
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            targetEl.classList.remove('hidden');
            void targetEl.offsetWidth; // trigger reflow
            targetEl.classList.add('active');

            // If switching to admin view or broadcast, load orders
            if (targetId === 'admin-section' || targetId === 'broadcast-section') {
                loadOrders();
            }
            // If switching to credit tracker, render credits
            if (targetId === 'credit-section') {
                renderCredits();
            }
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Show loading state
        btnText.style.display = 'none';
        loader.style.display = 'block';
        submitBtn.disabled = true;

        const mobileValue = document.getElementById('mobile').value;

        const data = {
            name: document.getElementById('name').value,
            purpose: document.getElementById('purpose').value,
            mobile: mobileValue
        };

        try {
            // Send request to real API
            const payload = {
                action: "create",
                ...data
            };

            const response = await fetch(API_URL, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            const actualResponse = await response.json();

            // Setup WA Btn with current user data
            setupWaUserBtn(actualResponse.orderId, data.purpose, mobileValue);

            showResult(actualResponse);


        } catch (error) {
            console.error("Error submitting request", error);
            alert("Failed to submit request. Please try again.");

            // Reset button
            btnText.style.display = 'block';
            loader.style.display = 'none';
            submitBtn.disabled = false;
        }
    });

    function showResult(response) {
        // Update DOM
        resOrderId.textContent = response.orderId;
        resPurpose.textContent = response.purpose;

        // Transition: Hide form, show result
        formSection.classList.remove('active');

        // Wait for fade out
        setTimeout(() => {
            formSection.classList.add('hidden');
            resultSection.classList.remove('hidden');

            // Trigger reflow
            void resultSection.offsetWidth;

            resultSection.classList.add('active');

            // Reset form for next time
            form.reset();
            btnText.style.display = 'block';
            loader.style.display = 'none';
            submitBtn.disabled = false;
        }, 400); // matches CSS transition
    }

    newRequestBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resultSection.classList.remove('active');

        setTimeout(() => {
            resultSection.classList.add('hidden');
            formSection.classList.remove('hidden');
            void formSection.offsetWidth;
            formSection.classList.add('active');
        }, 400);
    });

    function setupWaUserBtn(orderId, purpose, mobile) {
        waUserBtn.onclick = () => {
            const message = `Majestic Gallery City Mall\n\nനിങ്ങൾ നൽകിയ *${purpose}* ഐറ്റം സ്വീകരിച്ചിരിക്കുന്നു.\n\nറെഡിയായാൽ നിങ്ങളെ ഈ നമ്പറിൽ അറിയിക്കും. നന്ദി.`;
            const encodedMsg = encodeURIComponent(message);
            window.open(`https://wa.me/${mobile}?text=${encodedMsg}`, '_blank');
        };
    }

    // Admin Functions
    let allOrders = []; // Store loaded orders for Broadcast Helper
    refreshBtn.addEventListener('click', loadOrders);

    async function loadOrders() {
        orderListEl.innerHTML = '<div class="loader-container"><span class="loader"></span></div>';

        try {
            // Real API string with parameter
            const response = await fetch(`${API_URL}?action=getOrders`);
            const data = await response.json();

            if (data.status === "success" && data.orders) {
                allOrders = data.orders;
                renderOrders(data.orders);
            } else {
                throw new Error("Invalid response format");
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            orderListEl.innerHTML = '<div class="empty-state">Failed to load orders. Please check your connection.</div>';
        }
    }

    function renderOrders(orders) {
        if (!orders || orders.length === 0) {
            orderListEl.innerHTML = '<div class="empty-state">No recent orders found.</div>';
            return;
        }

        // Reverse to show newest first (assuming appended at bottom of sheet)
        const reversed = [...orders].reverse();

        orderListEl.innerHTML = reversed.map(order => `
            <div class="order-item">
                <div class="order-item-header">
                    <span class="order-item-id">#${order.orderId}</span>
                    <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span>
                </div>
                <div class="order-item-details">
                    <span class="order-item-name">${order.name}</span>
                    <span class="order-item-purpose">${order.purpose}</span>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${order.mobile}</span>
                </div>
                <div class="action-row" style="gap: 8px;">
                    ${order.status.toLowerCase() === 'processing' ? `
                        <button class="mark-ready-btn" data-id="${order.orderId}" style="flex: 1;">Mark Ready</button>
                        <button class="wa-icon-btn notify-processing-wa-btn" data-id="${order.orderId}" data-num="${order.mobile}" data-purpose="${order.purpose}" title="Message User">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                        </button>
                    ` : `
                        <button class="wa-icon-btn notify-wa-btn" data-id="${order.orderId}" data-num="${order.mobile}" data-purpose="${order.purpose}" style="width: 100%; justify-content: center;">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                            Notify User
                        </button>
                    `}
                </div>
            </div>
        `).join('');

        // Attach event listeners to new buttons
        document.querySelectorAll('.mark-ready-btn').forEach(btn => {
            btn.addEventListener('click', markOrderReady);
        });

        document.querySelectorAll('.notify-wa-btn').forEach(btn => {
            btn.addEventListener('click', sendAdminWaNotification);
        });

        document.querySelectorAll('.notify-processing-wa-btn').forEach(btn => {
            btn.addEventListener('click', sendAdminProcessingNotification);
        });
    }

    function sendAdminProcessingNotification(e) {
        const btn = e.currentTarget;
        const orderId = btn.getAttribute('data-id');
        const mobile = btn.getAttribute('data-num');
        const purpose = btn.getAttribute('data-purpose');

        let waNum = String(mobile).replace(/\D/g, '');
        if (waNum.length === 10) waNum = "91" + waNum;

        const message = `Majestic Gallery City Mall\n\nനിങ്ങൾ നൽകിയ *${purpose}* ഐറ്റം സ്വീകരിച്ചിരിക്കുന്നു.\n\nറെഡിയായാൽ നിങ്ങളെ ഈ നമ്പറിൽ അറിയിക്കും. നന്ദി.`;
        const encodedMsg = encodeURIComponent(message);
        window.open(`https://wa.me/${waNum}?text=${encodedMsg}`, '_blank');
    }

    function sendAdminWaNotification(e) {
        const btn = e.currentTarget;
        const orderId = btn.getAttribute('data-id');
        const mobile = btn.getAttribute('data-num');
        const purpose = btn.getAttribute('data-purpose'); // ← fixed: read from data attribute

        let waNum = String(mobile).replace(/\D/g, '');
        if (waNum.length === 10) waNum = "91" + waNum;

        const message = `Majestic Gallery City Mall\n*${purpose}* ready to collect...\n\nനിങ്ങളുടെ *${purpose}* റെഡിയായിട്ടുണ്ട്.\nനാളെ രാവിലെ വന്നു കളക്ട് ചെയ്യുമല്ലോ.\n\nമജസ്റ്റിക് Gallery യുടെ ഈ നമ്പർ നിങ്ങൾക്ക് സേവ് ചെയ്യാം.!!\n\nഭാവിയിൽ ഓഫറും കാര്യങ്ങളും നിങ്ങളെ ഇൻഫോം ചെയ്യുന്നതായിരിക്കും`;
        const encodedMsg = encodeURIComponent(message);
        window.open(`https://wa.me/${waNum}?text=${encodedMsg}`, '_blank');
    }

    async function markOrderReady(e) {
        const btn = e.target;
        const orderId = btn.getAttribute('data-id');
        const actionRow = btn.closest('.action-row');
        const orderItem = btn.closest('.order-item');

        // Optimistic UI update
        const originalText = btn.textContent;
        btn.textContent = "Updating...";
        btn.disabled = true;

        try {
            const payload = {
                action: "updateStatus",
                orderId: orderId,
                status: "Ready"
            };

            const response = await fetch(API_URL, {
                method: "POST",
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (data.status === "success") {
                // DOM Update instead of reload

                // 1. Update status badge
                const statusBadge = orderItem.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.textContent = "Ready";
                    statusBadge.className = "status-badge ready";
                }

                // 2. mobile + purpose are stored on the processing WA button
                const procWaBtn = actionRow.querySelector('.notify-processing-wa-btn');
                const mobile  = procWaBtn ? procWaBtn.getAttribute('data-num') : '';
                const purpose = procWaBtn ? procWaBtn.getAttribute('data-purpose') : '';

                // 3. Replace the entire action row contents
                actionRow.innerHTML = `
                    <button class="wa-icon-btn notify-wa-btn" data-id="${orderId}" data-num="${mobile}" data-purpose="${purpose}" style="width: 100%; justify-content: center;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                        Notify User
                    </button>
                `;

                // Re-attach listener to the newly injected button
                const newBtn = actionRow.querySelector('.notify-wa-btn');
                if (newBtn) {
                    newBtn.addEventListener('click', sendAdminWaNotification);
                }

                // Update the state array so it doesn't revert if switching tabs
                const orderIndex = allOrders.findIndex(o => o.orderId == orderId);
                if (orderIndex !== -1) {
                    allOrders[orderIndex].status = "Ready";
                }

            } else {
                throw new Error("Failed to update");
            }

        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status.");
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    // --- BROADCAST HELPER LOGIC ---
    const generateLinksBtn = document.getElementById('generateLinksBtn');
    const broadcastCustomerList = document.getElementById('broadcastCustomerList');
    const broadcastMessage = document.getElementById('broadcastMessage');
    const downloadVcfBtn = document.getElementById('downloadVcfBtn');

    if (generateLinksBtn) {
        generateLinksBtn.addEventListener('click', () => {
            const message = broadcastMessage.value.trim();
            if (!message) {
                alert("Please enter a message template first.");
                return;
            }

            if (allOrders.length === 0) {
                broadcastCustomerList.innerHTML = '<div class="empty-state">No customers found. Make sure orders are loaded.</div>';
                return;
            }

            // Extract unique customers
            const uniqueCustomers = [];
            const seenNumbers = new Set();

            allOrders.forEach(o => {
                if (o.mobile && !seenNumbers.has(o.mobile)) {
                    seenNumbers.add(o.mobile);
                    uniqueCustomers.push({ name: o.name, mobile: o.mobile });
                }
            });

            if (uniqueCustomers.length === 0) {
                broadcastCustomerList.innerHTML = '<div class="empty-state">No valid phone numbers found.</div>';
                return;
            }

            // Render list
            broadcastCustomerList.innerHTML = uniqueCustomers.map(c => {
                // Formatting number for WhatsApp link (basic assumption 91 for 10 digits as in standard Indian numbers)
                let waNum = String(c.mobile).replace(/\D/g, '');
                if (waNum.length === 10) waNum = "91" + waNum;

                const encodedMsg = encodeURIComponent(message);
                const link = `https://wa.me/${waNum}?text=${encodedMsg}`;

                return `
                    <div class="order-item" style="padding: 12px;">
                        <div class="order-item-header">
                            <span class="order-item-name">${c.name}</span>
                            <span style="font-size: 0.85rem; color: var(--text-muted);">${c.mobile}</span>
                        </div>
                        <div class="action-row" style="margin-top: 8px;">
                            <a href="${link}" target="_blank" class="wa-icon-btn" style="text-decoration: none; width: 100%; justify-content: center;">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                                Send Message
                            </a>
                        </div>
                    </div>
                `;
            }).join('');
        });

        downloadVcfBtn.addEventListener('click', () => {
            if (allOrders.length === 0) {
                alert("No customers found. Please wait for orders to load.");
                return;
            }

            const uniqueCustomers = [];
            const seenNumbers = new Set();
            allOrders.forEach(o => {
                if (o.mobile && !seenNumbers.has(o.mobile)) {
                    seenNumbers.add(o.mobile);
                    uniqueCustomers.push({ name: o.name, mobile: o.mobile });
                }
            });

            if (uniqueCustomers.length === 0) {
                alert("No valid phone numbers found.");
                return;
            }

            let vcfData = "";
            uniqueCustomers.forEach(c => {
                let waNum = String(c.mobile).replace(/\D/g, '');
                if (waNum.length === 10) waNum = "+91" + waNum;
                else if (waNum.length > 10 && !waNum.startsWith('+')) waNum = "+" + waNum;

                vcfData += "BEGIN:VCARD\r\n";
                vcfData += "VERSION:3.0\r\n";
                vcfData += `FN:${c.name || 'Customer'}\r\n`;
                vcfData += `TEL;TYPE=CELL:${waNum}\r\n`;
                vcfData += "END:VCARD\r\n";
            });

            const blob = new Blob([vcfData], { type: 'text/vcard' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'customers.vcf';
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
        });
    }


    // =================== SUPPLIER CREDIT TRACKER (Google Sheets) ===================

    let _cachedCredits = []; // local cache for the payment modal

    function totalPaid(credit) {
        return (credit.payments || []).reduce((s, p) => s + p.amount, 0);
    }

    function setCreditLoading(msg) {
        const listEl = document.getElementById('creditList');
        listEl.innerHTML = `<div class="loader-container"><span class="loader"></span><span style="margin-left:10px;color:var(--text-muted);font-size:0.9rem;">${msg || ''}</span></div>`;
    }

    async function renderCredits() {
        setCreditLoading('Loading from Google Sheets…');
        try {
            const res = await fetch(`${API_URL}?action=getCredits`);
            const data = await res.json();
            if (data.status !== 'success') throw new Error(data.message);
            _cachedCredits = data.credits || [];
            displayCredits(_cachedCredits);
        } catch (err) {
            document.getElementById('creditList').innerHTML =
                `<div class="empty-state">Failed to load. Check connection.</div>`;
            console.error(err);
        }
    }

    function displayCredits(credits) {
        const listEl = document.getElementById('creditList');
        const summaryEl = document.getElementById('creditSummary');

        // Summary cards
        const totalCredit  = credits.reduce((s, c) => s + c.amount, 0);
        const totalPaidAll = credits.reduce((s, c) => s + totalPaid(c), 0);
        const totalDue     = totalCredit - totalPaidAll;
        summaryEl.innerHTML = `
            <div style="flex:1;min-width:120px;background:rgba(255,255,255,0.06);border-radius:12px;padding:14px;text-align:center;">
                <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;">Total Credit</div>
                <div style="font-size:1.3rem;font-weight:700;color:#a78bfa;">₹${totalCredit.toLocaleString('en-IN')}</div>
            </div>
            <div style="flex:1;min-width:120px;background:rgba(255,255,255,0.06);border-radius:12px;padding:14px;text-align:center;">
                <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;">Total Paid</div>
                <div style="font-size:1.3rem;font-weight:700;color:#34d399;">₹${totalPaidAll.toLocaleString('en-IN')}</div>
            </div>
            <div style="flex:1;min-width:120px;background:rgba(255,255,255,0.06);border-radius:12px;padding:14px;text-align:center;">
                <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;">Outstanding</div>
                <div style="font-size:1.3rem;font-weight:700;color:${totalDue > 0 ? '#f87171' : '#34d399'};">₹${totalDue.toLocaleString('en-IN')}</div>
            </div>
        `;

        if (credits.length === 0) {
            listEl.innerHTML = '<div class="empty-state">No credits recorded yet.</div>';
            return;
        }

        const sorted = [...credits].sort((a, b) => new Date(b.date) - new Date(a.date));

        listEl.innerHTML = sorted.map(credit => {
            const paid        = totalPaid(credit);
            const due         = credit.amount - paid;
            const pct         = Math.min(100, Math.round((paid / credit.amount) * 100));
            const statusColor = due <= 0 ? '#34d399' : '#f87171';
            const statusLabel = due <= 0 ? 'Cleared' : 'Outstanding';

            const paymentsHtml = (credit.payments || []).map(p =>
                `<div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-muted);padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <span>📅 ${p.date}${p.note ? ' — ' + p.note : ''}</span>
                    <span style="color:#34d399;">+₹${p.amount.toLocaleString('en-IN')}</span>
                </div>`
            ).join('');

            return `
            <div class="order-item" data-credit-id="${credit.id}">
                <div class="order-item-header">
                    <span class="order-item-id">${credit.supplier}</span>
                    <span class="status-badge" style="background:${due <= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)'};color:${statusColor};">${statusLabel}</span>
                </div>
                <div style="font-size:0.85rem;color:var(--text-muted);margin:4px 0 10px;">${credit.note ? credit.note + ' · ' : ''}${credit.date}</div>

                <div style="background:rgba(255,255,255,0.07);border-radius:6px;height:6px;margin-bottom:10px;overflow:hidden;">
                    <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#6366f1,#a78bfa);border-radius:6px;transition:width 0.4s;"></div>
                </div>

                <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:12px;">
                    <span>Paid: <strong style="color:#34d399;">₹${paid.toLocaleString('en-IN')}</strong></span>
                    <span>Due: <strong style="color:${statusColor};">₹${due.toLocaleString('en-IN')}</strong></span>
                    <span>Total: <strong>₹${credit.amount.toLocaleString('en-IN')}</strong></span>
                </div>

                ${credit.payments && credit.payments.length > 0 ? `
                <details style="margin-bottom:12px;">
                    <summary style="font-size:0.8rem;color:var(--text-muted);cursor:pointer;">Payment history (${credit.payments.length})</summary>
                    <div style="margin-top:8px;">${paymentsHtml}</div>
                </details>` : ''}

                <div class="action-row" style="gap:8px;">
                    ${due > 0 ? `<button class="credit-pay-btn" data-id="${credit.id}" style="flex:1;">💰 Pay</button>` : ''}
                    <button class="credit-delete-btn" data-id="${credit.id}" style="flex:1;background:rgba(248,113,113,0.1);border-color:rgba(248,113,113,0.3);color:#f87171;">🗑 Delete</button>
                </div>
            </div>`;
        }).join('');

        document.querySelectorAll('.credit-pay-btn').forEach(btn => {
            btn.addEventListener('click', () => openPaymentModal(btn.getAttribute('data-id')));
        });
        document.querySelectorAll('.credit-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteCredit(btn.getAttribute('data-id')));
        });
    }

    // ── Add Credit ──
    const addCreditBtn = document.getElementById('addCreditBtn');
    if (addCreditBtn) {
        addCreditBtn.addEventListener('click', async () => {
            const supplier = document.getElementById('creditSupplier').value.trim();
            const note     = document.getElementById('creditNote').value.trim();
            const amount   = parseFloat(document.getElementById('creditAmount').value);
            const date     = document.getElementById('creditDate').value || new Date().toISOString().slice(0, 10);

            if (!supplier || isNaN(amount) || amount <= 0) {
                alert('Please enter supplier name and a valid credit amount.');
                return;
            }

            addCreditBtn.textContent = 'Saving…';
            addCreditBtn.disabled = true;

            try {
                const res = await fetch(API_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'addCredit', supplier, note, amount, date })
                });
                const data = await res.json();
                if (data.status !== 'success') throw new Error(data.message);

                document.getElementById('creditSupplier').value = '';
                document.getElementById('creditNote').value = '';
                document.getElementById('creditAmount').value = '';
                document.getElementById('creditDate').value = new Date().toISOString().slice(0, 10);
                await renderCredits();
            } catch (err) {
                alert('Failed to save credit. Please try again.');
                console.error(err);
            } finally {
                addCreditBtn.textContent = '+ Add Credit';
                addCreditBtn.disabled = false;
            }
        });
    }

    // Set today as default date
    const creditDateInput = document.getElementById('creditDate');
    if (creditDateInput) creditDateInput.value = new Date().toISOString().slice(0, 10);

    // Refresh button
    const refreshCreditsBtn = document.getElementById('refreshCreditsBtn');
    if (refreshCreditsBtn) refreshCreditsBtn.addEventListener('click', renderCredits);


    // ── Delete Credit ──
    async function deleteCredit(id) {
        if (!confirm('Delete this credit entry?')) return;
        const item = document.querySelector(`[data-credit-id="${id}"]`);
        if (item) item.style.opacity = '0.4';
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'deleteCredit', creditId: id })
            });
            const data = await res.json();
            if (data.status !== 'success') throw new Error(data.message);
            await renderCredits();
        } catch (err) {
            alert('Failed to delete. Please try again.');
            if (item) item.style.opacity = '1';
            console.error(err);
        }
    }

    // ── Payment Modal ──
    let _payingCreditId = null;
    let _payingCreditDue = 0;
    const paymentModal = document.getElementById('paymentModal');

    function openPaymentModal(id) {
        const credit = _cachedCredits.find(c => c.id === id);
        if (!credit) return;
        _payingCreditId  = id;
        _payingCreditDue = credit.amount - totalPaid(credit);
        document.getElementById('paymentModalInfo').textContent =
            `${credit.supplier} — Outstanding: ₹${_payingCreditDue.toLocaleString('en-IN')}`;
        document.getElementById('paymentAmount').value = '';
        document.getElementById('paymentNote').value = '';
        paymentModal.style.display = 'flex';
    }

    document.getElementById('cancelPaymentBtn').addEventListener('click', () => {
        paymentModal.style.display = 'none';
        _payingCreditId = null;
    });

    document.getElementById('confirmPaymentBtn').addEventListener('click', async () => {
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const note   = document.getElementById('paymentNote').value.trim();

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid payment amount.');
            return;
        }
        if (amount > _payingCreditDue) {
            alert(`Payment cannot exceed outstanding amount (₹${_payingCreditDue.toLocaleString('en-IN')}).`);
            return;
        }

        const confirmBtn = document.getElementById('confirmPaymentBtn');
        confirmBtn.textContent = 'Saving…';
        confirmBtn.disabled = true;

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'addPayment',
                    creditId: _payingCreditId,
                    amount,
                    note,
                    date: new Date().toISOString().slice(0, 10)
                })
            });
            const data = await res.json();
            if (data.status !== 'success') throw new Error(data.message);

            paymentModal.style.display = 'none';
            _payingCreditId = null;
            await renderCredits();
        } catch (err) {
            alert('Failed to save payment. Please try again.');
            console.error(err);
        } finally {
            confirmBtn.textContent = 'Confirm Payment';
            confirmBtn.disabled = false;
        }
    });

    // Close modal on backdrop click
    paymentModal.addEventListener('click', (e) => {
        if (e.target === paymentModal) {
            paymentModal.style.display = 'none';
            _payingCreditId = null;
        }
    });

});
