<?php
// Database connection settings
$host = 'localhost';
$db = 'kiosk_orders';  // Your database name
$user = 'root';  // Default XAMPP user
$pass = '';  // Default XAMPP password

// Create a connection
$conn = new mysqli($host, $user, $pass, $db);

// Check the connection
if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Connection failed: " . $conn->connect_error]));
}

// Get the data from the POST request
$orderData = json_decode(file_get_contents('php://input'), true);

// Extract payer information
$payer_name = $orderData['payer_name'];
$payer_mobile = $orderData['payer_mobile'];
$payment_method = $orderData['payment_method'];

// Calculate total price based on quantity
$total_price = 0;
foreach ($orderData['order'] as $orderItem) {
    $total_price += $orderItem['price'] * $orderItem['quantity'];
}

// Insert into the payments table
$stmt = $conn->prepare("INSERT INTO payments (payer_name, payer_mobile, payment_method, total_price) VALUES (?, ?, ?, ?)");
$stmt->bind_param("sssd", $payer_name, $payer_mobile, $payment_method, $total_price);

if ($stmt->execute()) {
    $payment_id = $stmt->insert_id;

    // Insert each item into the order_items table
    $stmt_items = $conn->prepare("INSERT INTO order_items (payment_id, item_name, price, quantity) VALUES (?, ?, ?, ?)");
    foreach ($orderData['order'] as $orderItem) {
        $item_name = $orderItem['item'];
        $price = $orderItem['price'];
        $quantity = $orderItem['quantity'];
        $stmt_items->bind_param("isdi", $payment_id, $item_name, $price, $quantity);
        $stmt_items->execute();
    }

    $stmt_items->close();
    echo json_encode(["status" => "success", "message" => "Order saved successfully!"]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to save order."]);
}

$stmt->close();
$conn->close();
?>
