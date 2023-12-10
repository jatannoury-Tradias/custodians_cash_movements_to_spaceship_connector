import pandas as pd
import requests

# from config.currencies import currencies

currencies = []

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
    res = requests.get(f"https://{env}.tradias.link/api/clients/?skip=0&limit=1000&search_param=&sorting_field=created_at&sorting_direction=desc&show_deleted=false",headers={
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
        res = requests.post(f"https://{env}.tradias.link/api/addresses",
                        headers={
                            "Authorization": f"Bearer {token}",
                        },
                        json={
                            "address":row['keyword'],
                            "currencies":[row['Currency']],
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
token = authenticate('uat')
def put_address(env,address_id,data):
    return requests.put(f"https://{env}.tradias.link/api/addresses/{address_id}",headers={
        "Authorization": f"Bearer {token}",
    },json=data)
def put_client(env,client_id,data):
    return requests.put(f"https://{env}.tradias.link/api/clients/{client_id}", headers={
        "Authorization": f"Bearer {token}",
    }, json=data)
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
def push_client(env):
     return requests.post(f"https://{env}.tradias.link/api/clients/?skip=0&limit=9&search_param=Reyn-tra&sorting_field=created_at&sorting_direction=desc&show_deleted=false",
                        headers={
                            "Authorization": f"Bearer {token}",
                        },
                          json={

                          }
                        ).json()['items']
def get_client(env,client_id):
    return requests.get(f"https://{env}.tradias.link/api/counter_parties/{client_id}",headers={
                            "Authorization": f"Bearer {token}",
                        }).json()
if __name__ == "__main__":
    import pandas as pd
    wallets_df = pd.read_excel(r"C:\Users\jtannoury\Downloads\Mapping Spaceship - Set up wallets - UAT 2 (1).xlsx")
    push_addresses('uat',r"C:\Users\jtannoury\Downloads\Mapping Spaceship - Set up wallets - UAT 2 (1).xlsx")
    pass











    # push_addresses("uat", r"C:\Users\jtannoury\Downloads\Mapping Spaceship - Set up wallets - UAT (2).xlsx")
    # clients = pd.DataFrame(get_clients("uat"))
    # addresses = get_all_addresses('uat')
    # addresses_info = pd.DataFrame(get_custodians('uat'))
    # df = pd.DataFrame(addresses)
    # merged_df = pd.merge(df, addresses_info, left_on='owner_id', right_on='id', how='left')
    #
    # # Create the 'account_holder' column based on the condition
    # merged_df['account_holder'] = merged_df['name']
    #
    # # Drop unnecessary columns if needed
    #
    # # Now, 'account_holder' is a new column in 'df'
    # df['account_holder'] = merged_df['account_holder']
    # df['company'] = df['label'].str.split(" - ").str[1].str.strip()
    # df = df[df['account_holder'].str.lower().str.startswith("tradias gmbh") & ~df['account_holder'].isna()]
    # df = df[df['owner_id'].str.startswith("fb1")]
    # for index,row in df.iterrows():
    #     res = put_address('uat',row['id'],{
    #                 "address":row['address'],
    #                 "currencies":row['currencies'],
    #                 "custodian_id":row['custodian_id'],
    #                 "label":row['label'],
    #                 "owner_id":"2509e36c-b4e4-4762-9a6e-b0039a0e7d04",
    #                 "status":"ACTIVE"
    #             })
    # mapping_table = pd.read_excel(r"C:\Users\jtannoury\Downloads\Account Holder - Mapping Table - Deposit transactions.xlsx")
    # df_name_groups = df.groupby("account_holder")
    # test = []
    # # df = df[df['label'].str.contains(" - ") == False]
    # # df = df[(df['label'].str.strip().str.lower() != df['account_holder'].str.strip().str.lower()) & (df['label'].str.strip() != '')]
    # # pass
    # # legacy_clients = pd.read_csv(r'C:\Users\jtannoury\Desktop\config_script_otc_2\data\config_files\current_build\UAT\client_master.csv')
    # # for index,row in df.iterrows():
    # #     spaceship_client = get_client('uat',row['owner_id'])
    # #     if spaceship_client['type'] == 'TRADIAS_ENTITY' and spaceship_client['name'] == "Tradias GmbH":
    # #         continue
    # #     res = put_client('uat',row['owner_id'],{
    # #         "id":row['owner_id'],
    # #         "name":row['label'],
    # #         "email":spaceship_client["email"],
    # #         "address":"123,     123,     123",
    # #         "phone":spaceship_client["phone"],
    # #         "client_legacy_id": spaceship_client["client_legacy_id"]
    # #     })
    # # indexed_mapping_table = mapping_table.set_index("Key")
    # # for index,row in mapping_table.iterrows():
    # #     try:
    # #         df_name_group = df_name_groups.get_group(row['Key'].strip())
    # #         company_name = indexed_mapping_table.loc[row['Key']]['Value']
    # #         df_name_group['company'] = [company_name for i in range(len(df_name_group))]
    # #         for index,row_1 in df_name_group.iterrows():
    # #             res = put_address('uat',row_1['id'],{
    # #                 "address":row_1['address'],
    # #                 "currencies":row_1['currencies'],
    # #                 "custodian_id":row_1['custodian_id'],
    # #                 "label":row_1['label'],
    # #                 "owner_id":df[df['label'] == row_1['company']]['owner_id'].values[0],
    # #                 "status":"ACTIVE"
    # #             })
    # #             if res.status_code == 200:
    # #                 print("Success",{
    # #                 "address":row_1['address'],
    # #                 "currencies":row_1['currencies'],
    # #                 "custodian_id":row_1['custodian_id'],
    # #                 "label":df[df['label'] == row_1['company']]['label'],
    # #                 "owner_id":row_1['owner_id'],
    # #                 "status":"ACTIVE"
    # #             })
    # #             else:
    # #                 print(res.status_code)
    # #     except Exception as e:
    # #         print("Disregarded:",row['Key'])
    # #         continue
    # #
    # # pass
    #
