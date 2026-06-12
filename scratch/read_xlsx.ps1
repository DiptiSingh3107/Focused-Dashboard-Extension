Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipPath = 'd:\CodeBasics\focusboard\Daily_Affirmations_50.xlsx'
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$sheet = $zip.Entries | Where-Object { $_.FullName -eq 'xl/worksheets/sheet1.xml' }

$sr = New-Object System.IO.StreamReader($sheet.Open())
$rawXml = $sr.ReadToEnd()
$sr.Close()
$zip.Dispose()

[xml]$xml = $rawXml
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")

$quotes = @()
foreach ($row in $xml.SelectNodes("//x:row", $ns)) {
    $rowNum = [int]$row.GetAttribute("r")
    if ($rowNum -lt 2) { continue }  # skip header
    foreach ($cell in $row.SelectNodes("x:c", $ns)) {
        $ref = $cell.GetAttribute("r")
        if ($ref -match "^C") {
            $t = $cell.SelectSingleNode("x:is/x:t", $ns)
            if ($t -and $t.InnerText.Trim().Length -gt 0) {
                $quotes += $t.InnerText.Trim()
            }
        }
    }
}

Write-Output "Found $($quotes.Count) quotes:"
for ($i = 0; $i -lt $quotes.Count; $i++) {
    Write-Output "$($i+1): $($quotes[$i])"
}
