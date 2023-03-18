from flask import Flask, make_response,Response,render_template
import io
import csv
from flask import jsonify,request
import pandas as pd
import numpy as np
import seaborn as sns
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from flask_cors import CORS


# data = pd.read_csv("vgsales.csv")

def do_pca(date_from, date_to):
  
  data = pd.read_csv("vgsales.csv").iloc[:3000]
  if(date_from == date_to):
    pre_data = data[data["Year"]==int(date_from)]

  else:   
    pre_data = data[data["Year"]>=int(date_from)]
    pre_data = pre_data[pre_data["Year"]<=int(date_to)] 
    
  mean_sales = pre_data["Global_Sales"].mean()
  colors = np.where((pre_data['Global_Sales'])> mean_sales, 'green', 'red')
  print("colors cikti")
  pre_data=pre_data.reset_index(drop=True)
  
  pre_pca_data=pre_data.iloc[:, 6:10]
  data_std = StandardScaler().fit_transform(pre_pca_data)
  pca=PCA(n_components=2)
  d_pca=pca.fit_transform(data_std)
  df_pca = pd.DataFrame(d_pca)
  df_pca.rename(columns={0: "X1"}, inplace=True)
  df_pca.rename(columns={1: "X2"}, inplace=True)
  df_pca['color'] = colors
  df_pca['Name'] = pre_data['Name']
  df_pca['Platform'] = pre_data['Platform']  
  df_pca['Genre'] = pre_data['Genre']
  df_pca['Year'] = pre_data['Year']

  df_pca['Publisher'] = pre_data['Publisher']
  df_pca['NA_Sales'] = pre_data['NA_Sales']
  df_pca['EU_Sales'] = pre_data['EU_Sales']
  df_pca['JP_Sales'] = pre_data['JP_Sales']
  df_pca['Other_Sales'] = pre_data['Other_Sales']
  df_pca['Global_Sales'] = pre_data['Global_Sales']
  #Genre,Publisher,NA_Sales,EU_Sales,JP_Sales,Other_Sales,Global_Sales
  print(df_pca.shape)
  # d = df_pca.append(pre_data)
  return df_pca


app = Flask(__name__)
CORS(app)


@app.route("/home",methods = ['GET'])
def hello():
  date_from = request.args.get('from')
  date_to = request.args.get('to')
  if not date_from:
    date_from = 1980
    date_to = 2020
  pca_data=do_pca(date_from,date_to)
  response = make_response(pca_data.to_csv())
  response.headers['Content-Type'] = 'text/csv'
  return response 

@app.route("/",methods = ['GET'])
def home():
  return render_template('filename.html')

if __name__ == "__main__":
  app.debug=True
  app.run()