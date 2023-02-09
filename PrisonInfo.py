from bs4 import BeautifulSoup
import requests
import time
import json
import urllib3

base_url = "https://www.tdcj.texas.gov/unit_directory/"
urllib3.disable_warnings()

# Load MapQuest Geocoder V1 API key
with open("config.json") as key_file:
    key = json.load(key_file)['api_key']

# Retrieve html page names from base_url
html = requests.get(base_url + 'index.html', verify=False)
soup = BeautifulSoup(html.text, features="html.parser")

prison_abbreviations = soup.findAll('td')
html_abb = ['NF', 'WY']
index = 0
modulo = 9
for prison_abbreviation in prison_abbreviations:
    if index == 0:
        index += 1
        continue
    elif (index % modulo) == 0:
        modulo += 8
        html_abb.append(prison_abbreviation.get_text())
    elif index == 1:
        html_abb.append(prison_abbreviation.get_text())
    index += 1

html_list = [sub.replace('E1', 'e') for sub in html_abb]
time.sleep(10)

# Retrieve data from individual html pages in html_list
geojson = {
    "type": "FeatureCollection",
    "features": []
}
html_index = 0

for html in html_list:
    print(html)
    html = requests.get(base_url + html + '.html', verify=False)
    soup = BeautifulSoup(html.text, features="html.parser")

    unit_dict = {}
    data = soup.findAll('p')
    title = soup.findAll('h1')
    image = soup.findAll('img')
    unit_dict['Name'] = title[0].get_text()
    unit_dict['Senior Warden Image'] = "https://www.tdcj.texas.gov/" + \
        image[-1].get('src')
    jail_names = ['Unit', 'Jail', 'Center', 'Facility']

    index = 0
    for data_element in data:
        if index < 3:
            if index == 0:
                unit_dict['ACA Accredited'] = data_element.get_text()
            elif index == 2:
                pre_address = " ".join(
                    data_element.get_text().split()).split(" ")

                for count, word in enumerate(pre_address):
                    if word in jail_names:
                        del pre_address[0:count+1]

                address = " ".join(pre_address)
                unit_dict['Address'] = address
            index += 1
            continue
        else:
            element = " ".join(data_element.get_text().split()).split(":")
            unit_dict[element[0]] = element[1].strip()
            index += 1
    html_index += 1

    geocoder_params = {
        'key': key,
        'location': unit_dict['Address']
    }
    geocoder = requests.get(
        "http://www.mapquestapi.com/geocoding/v1/address", geocoder_params)
    coordinates = json.loads(geocoder.text)[
        "results"][0]['locations'][0]['latLng']
    x = coordinates['lng']
    y = coordinates['lat']
    print(coordinates)

    unit_geojson = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [x, y]
        },
        "properties": {

        }
    }
    unit_geojson["properties"] = unit_dict
    geojson["features"].append(unit_geojson)

    time.sleep(30)

out_file = open("./web-app/data/units.geojson", "w")
json.dump(geojson, out_file, indent=3)

print("Completed")
