$csv_path = "C:\Users\Admin\Desktop\Work Space\flush and gap\fag_service\test" 
$csv_url = "http://localhost:3000/system-info/result"
$csv_temp_path = "C:\Users\Admin\Desktop\Work Space\flush and gap\fag_service\temp"

$pdf_path = "C:\Users\Admin\Desktop\Work Space\flush and gap\fag_service\test" 
$pdf_url = "http://localhost:3000/system-info/result"
$pdf_temp_path = "C:\Users\Admin\Desktop\Work Space\flush and gap\fag_service\temp"

Function Csv-Report  {
    $file =  Get-ChildItem -Path $csv_path -Filter "*.csv" | Select-Object -ExpandProperty FullName
    $length =  (Get-ChildItem -Path $csv_path -Filter "*.csv" | Measure-Object ).Count
    If ($length) {
        If ($length -eq 1) {$file_path = $file}
        else {$file_path = $file[0]}
        $meaResult = Get-Content -Path $file_path  | Select -Skip 5 | ConvertFrom-Csv -Delimiter ';'
        $csv =  Import-Csv $file_path  -Delimiter ';' | Foreach-Object { 
            foreach ($property in $_.PSObject.Properties)
            {
                $property.value
            } 
        }
        $body = @{id = $csv[1] ; data  = $meaResult }  
        $res = Invoke-WebRequest -Uri  $csv_url -Method POST -Body ($body|ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
        $res
        if ($res.StatusCode -eq 201) { Move-Item -Path $file_path  -Destination $csv_temp_path}
    }
} 

Function Pdf-Report  {
    $file =  Get-ChildItem -Path $pdf_path -Filter "*.pdf" | Select-Object -ExpandProperty FullName
    $length =  (Get-ChildItem -Path $pdf_path -Filter "*.pdf" | Measure-Object ).Count
    If ($length) {
        If ($length -eq 1) {$file_path = $file}
        else {$file_path = $file[0]}
        $prodnum = Split-Path $file_path -leaf
        $pdf = Get-Content -Path $file_path -Encoding Byte
        $base64 =[Convert]::ToBase64String($pdf) 
        $body = @{prodNum = $prodnum ; base64  = $base64}
        $body
        $res = Invoke-WebRequest -Uri  $pdf_url -Method POST -Body ($body|ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
        $res
        if ($res.StatusCode -eq 201) { Move-Item -Path $file_path  -Destination $pdf_temp_path}
    }
} 

While (1) {
    Pdf-Report
    Start-Sleep 2
}