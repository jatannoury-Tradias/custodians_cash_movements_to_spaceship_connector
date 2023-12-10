import pandas as pd
import requests

from config.currencies import currencies


def authenticate(env):
    return requests.post(f"https://{env}.tradias.link/api/authenticate", json={
        "email": "admin@tradias.de",
        "secret": "admin@tradias.de"
    }).json()["auth_token"]


def migrate_custodians(env, csv_path):
    token = authenticate(env)
    df = pd.read_excel(csv_path)
    custodians = list(df['Custodian'].unique())
    for custodian in custodians:
        res = requests.post(f"https://{env}.tradias.link/api/custodians/",
                            headers={
                                "Authorization": f"Bearer {token}",
                            },
                            json={
                                "address": "0, ., .",
                                "email": f"{''.join(custodian.casefold().split())}@tradias.link",
                                "name": custodian,
                                "phone": "0"
                            }
                            )


def migrate_clients(env, csv_path):
    token = authenticate(env)
    df = pd.read_excel(csv_path)
    clients = list(df['Account Holder'].unique())
    for client in clients:
        res = requests.post(f"https://{env}.tradias.link/api/clients/",
                            headers={
                                "Authorization": f"Bearer {token}",
                            },
                            json={
                              "name": client,
                              "email": f"{''.join(client.casefold().split())}@tradias.link",
                              "phone": "0",
                              "address": "0, 0, 0",
                              "tier_id": "",
                              "tolerance_factor": "",
                              "trading_halt": False,
                              "initial_margin": "",
                              "client_legacy_id": ""
                            }
                )
        if res.status_code == 201:
            print("Client Added:",client)
        elif res.status_code == 409:
            print("Duplicate Client:",client)
        else:
            pass
    pass
def get_custodians(env):
    token=authenticate(env)
    res = requests.get(f"https://{env}.tradias.link/api/counter_parties/names?show_deleted=false",headers={
                                "Authorization": f"Bearer {token}",
                            }).json()
    return res['items']
def get_clients(env):
    token=authenticate(env)
    res = requests.get(f"https://{env}.tradias.link/api/clients/?skip=0&limit=200&search_param=&sorting_field=created_at&sorting_direction=desc&show_deleted=false",headers={
                                "Authorization": f"Bearer {token}",
                            }).json()
    return res['items']
def push_addresses(env, csv_path):
    token = authenticate(env)
    df = pd.read_excel(csv_path)
    custodians = get_custodians(env)
    clients = get_clients(env)
    clients_name_mapping = {
        element['name']:element for element in clients
    }
    cusotdians_name_mapping = {
        element['name']: element for element in custodians
    }
    for index,row in df.iterrows():
        client_address= clients_name_mapping.get(row['Account Holder'].strip(),None)
        if client_address == None:
            print(f"Skipping {row['Account Holder']}")
            continue
        if row['Account Holder'].casefold() == "tradias gmbh":
            label = f'{row["name"]} - Pool Wallet'
        else:
            label = f'{row["custodian"]} - {row[""]}'

        res = requests.post(f"https://{env}.tradias.link/api/addresses",
                        headers={
                            "Authorization": f"Bearer {token}",
                        },
                        json={
                            "address":row['keyword'],
                            "currencies":currencies,
                            "custodian_id":cusotdians_name_mapping[row['Custodian'].strip()]['id'],
                            "label":row['Label'],
                            "owner_id":client_address['id'],
                            "status":"ACTIVE"
                        }
                        )
        if res.status_code == 201:
            print("Address Added:", 'client')
        elif res.status_code == 409:
            print("Duplicate Address:", 'client')
        else:
            pass
def get_all_addresses(env):
    token = authenticate(env)
    res = requests.get(f"https://{env}.tradias.link/api/addresses/?show_deleted=false&limit=1000", headers={
        "Authorization": f"Bearer {token}",
    }).json()
    return res['items']
def delete_duplicate_addresses(env):
    token = authenticate(env)
    clients_addresses = get_all_addresses(env)
    data = {}
    df = pd.DataFrame(clients_addresses)
    for index,row in df.iterrows():
        if row['address'] in data:
            data[row['address']]['count'] +=1
        else:
            data[row['address']] = {"id":row['id'],"count":1}
    for adress in data.keys():
        if data[adress]['count'] == 1:
            continue
        while data[adress]['count'] != 1:
            res = requests.delete(f"https://{env}.tradias.link/api/addresses/{data[adress]['id']}",headers={
                                "Authorization": f"Bearer {token}",
                            })
            pass
            data[adress]['count'] -=1
    pass
if __name__ == "__main__":
    # push_addresses("uat", r"C:\Users\jtannoury\Downloads\Mapping Spaceship - Set up wallets - UAT.xlsx")
    delete_duplicate_addresses('uat')

