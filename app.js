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

            formSection.classList.remove('active');
            resultSection.classList.remove('active');
            adminSection.classList.remove('active');
            if (broadcastSection) broadcastSection.classList.remove('active');

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
            const message = `We received your Order ID: *${orderId}* for *${purpose}*. We are currently processing it. Feel free to reply here if you have any questions!\nSave number for future updates.`;
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
                        <button class="wa-icon-btn notify-wa-btn" data-id="${order.orderId}" data-num="${order.mobile}" style="width: 100%; justify-content: center;">
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

        const message = `We received your Order ID: *${orderId}* for *${purpose}*. We are currently processing it. Feel free to reply here if you have any questions!\nSave number for future updates.`;
        const encodedMsg = encodeURIComponent(message);
        window.open(`https://wa.me/${waNum}?text=${encodedMsg}`, '_blank');
    }

    function sendAdminWaNotification(e) {
        const btn = e.currentTarget;
        const orderId = btn.getAttribute('data-id');
        const mobile = btn.getAttribute('data-num');

        let waNum = String(mobile).replace(/\D/g, '');
        if (waNum.length === 10) waNum = "91" + waNum;

        const message = `Your Order ID: *${orderId}* is ready. Please come and collect.`;
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

                // 2. We need the mobile number to create the WA button. It's stored on the processing WA button.
                const procWaBtn = actionRow.querySelector('.notify-processing-wa-btn');
                const mobile = procWaBtn ? procWaBtn.getAttribute('data-num') : '';

                // 3. Replace the entire action row contents
                actionRow.innerHTML = `
                    <button class="wa-icon-btn notify-wa-btn" data-id="${orderId}" data-num="${mobile}" style="width: 100%; justify-content: center;">
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

});
