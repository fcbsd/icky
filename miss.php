<?php
$missing = array();
$missing['date'] = date("d-M-y H:i:s");
$missing['ip'] = $_SERVER['REMOTE_ADDR'];
foreach($_GET as $key => $value) {
	$missing[$key] = $value;
}

$missfp = fopen('missing.txt', 'a');
fputcsv($missfp, $missing);
fclose($missfp);

echo "cmd noted";

?>
