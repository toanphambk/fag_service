$path = "C:\Users\Admin\Desktop\Work Space\flush and gap\fag_service\test" 
$url = "http://localhost:3000/system-info/result"
$temp_path = "C:\Users\Admin\Desktop\Work Space\flush and gap\fag_service\temp"

While (1) {
    $file =  Get-ChildItem -Path $path -Filter "*.csv" | Select-Object -ExpandProperty FullName
    $length =  (Get-ChildItem -Path $path -Filter "*.csv" | Measure-Object ).Count
    If ($length) {
        If ($length -eq 1) {$csv_path = $file}
        else {$csv_path = $file[0]}
        $meaResult = Get-Content -Path $csv_path  | Select -Skip 5 | ConvertFrom-Csv -Delimiter ';'
        $csv =  Import-Csv $csv_path  -Delimiter ';' | Foreach-Object { 
            foreach ($property in $_.PSObject.Properties)
            {
                $property.value
            } 
        }
        $body = @{id = $csv[1] ; data  = $meaResult }  
        $res = Invoke-WebRequest -Uri  $url -Method POST -Body ($body|ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
        $res
        # if ($res.StatusCode -eq 201) { Move-Item -Path $csv_path  -Destination $temp_path}
    }
    Start-Sleep 10
}